import crypto from "crypto";
import mongoose from "mongoose";
import Cart from "../cart/cart.model.js";
import Order from "../orders/order.model.js";
import * as orderService from "../orders/order.service.js";
import * as couponService from "../coupons/coupon.service.js";
import { calculateCheckoutPricing } from "../checkout/checkout.service.js";
import User from "../auth/user.model.js";
import logger from "../../shared/utils/logger.util.js";
import { getRazorpayInstance, RAZORPAY_CURRENCY } from "./payment.config.js";

// ============================================================================
// CREATE RAZORPAY ORDER
// ============================================================================

/**
 * Validate cart, create a pending DB order, then create a Razorpay order.
 *
 * Flow:
 *  1. Validate user + addresses
 *  2. Validate cart items + calculate full pricing (reuses checkout logic)
 *  3. Save order to DB with orderStatus = "pending", payment.status = "pending"
 *  4. Reduce stock immediately (stock is "reserved" for the session)
 *  5. Create Razorpay order for the exact total amount
 *  6. Return { orderId, razorpayOrderId, amount, currency, keyId } to frontend
 *
 * @param {String} userId
 * @param {Object} checkoutData - { shippingAddressId, billingAddressId, couponCode, customerNote }
 * @returns {Promise<Object>}
 */
export const createRazorpayOrder = async (userId, checkoutData) => {
    const {
        shippingAddressId,
        billingAddressId,
        couponCode,
        customerNote = "",
    } = checkoutData;

    // ── 1. Validate user & addresses ────────────────────────────────────────
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const shippingAddress = user.addresses.id(shippingAddressId);
    if (!shippingAddress) throw new Error("Shipping address not found");

    let billingAddress;
    if (!billingAddressId || billingAddressId === "same_as_shipping") {
        billingAddress = shippingAddress;
    } else {
        billingAddress = user.addresses.id(billingAddressId);
        if (!billingAddress) throw new Error("Billing address not found");
    }

    // ── 2. Get & validate cart ───────────────────────────────────────────────
    const cart = await Cart.findOne({ userId })
        .populate({
            path: "items.productId",
            select: "name images purity makingChargesPerGram gstRate category subcategory",
        })
        .populate({
            path: "items.variantId",
            select: "sku variantName size color weight sellingPrice stockQuantity images gemstoneCharges priceBreakdown",
        });

    if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
    }

    // ── 3. Calculate full pricing ───────────────────────────────────────────
    const { items, pricing, warnings } = await calculateCheckoutPricing(
        cart.items,
        couponCode || null,
        userId,
    );

    const stockWarnings = warnings.filter(
        (w) => w.issue === "Insufficient stock",
    );
    if (stockWarnings.length > 0) {
        throw new Error(
            "Some items are out of stock: " +
                stockWarnings.map((w) => w.productName).join(", "),
        );
    }

    if (items.length === 0) {
        throw new Error("No valid items in cart");
    }

    // ── 4. Format addresses ──────────────────────────────────────────────────
    const fmtAddress = (addr) => ({
        name: addr.name,
        phone: addr.phone,
        line1: addr.addressLine1,
        line2: addr.addressLine2,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
    });

    const formattedShipping = fmtAddress(shippingAddress);
    const formattedBilling =
        !billingAddressId || billingAddressId === "same_as_shipping"
            ? formattedShipping
            : fmtAddress(billingAddress);

    // ── 5. Build order items ─────────────────────────────────────────────────
    const orderItems = items.map((item) => ({
        product: item.product._id,
        variant: item.variant._id,
        productName: item.product.name,
        variantName: item.variant.variantName,
        sku: item.variant.sku,
        image: item.variant.images?.[0] || item.product.images?.[0],
        quantity: item.quantity,
        weight: item.weight,
        metalValue: item.metalValue,
        makingCharges: item.makingCharges,
        gemstoneCharges: item.gemstoneCharges,
        sellingPrice: item.sellingPrice,
        baseAmount: item.baseAmount,
        discountBase: item.discountBase,
        taxableValue: item.taxableValue,
        gstRate: item.gstRate,
        gstAmount: item.gstAmount,
        total: item.total,
    }));

    // ── 6. Save pending order to DB (in a transaction) ───────────────────────
    const session = await mongoose.startSession();
    session.startTransaction();

    let order;
    try {
        const orderData = {
            customer: userId,
            items: orderItems,
            shippingAddress: formattedShipping,
            billingAddress: formattedBilling,
            pricing,
            payment: {
                method: "razorpay",
                status: "pending",
            },
            orderStatus: "pending",
            statusHistory: [{ status: "pending", timestamp: new Date() }],
            customerNote,
        };

        if (pricing.coupon) {
            orderData.appliedCoupon = {
                code: pricing.coupon.code,
                description: pricing.coupon.description,
                discountType: pricing.coupon.discountType,
                discountValue: pricing.coupon.discountValue,
                discountAmount: pricing.coupon.discountApplied,
            };
        }

        order = await orderService.createOrder(orderData, session);

        // Reserve stock immediately so the user can't overcommit
        await orderService.reduceStock(orderItems, session);

        await session.commitTransaction();
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }

    // ── 7. Create Razorpay order ─────────────────────────────────────────────
    // Amount must be in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(pricing.total * 100);

    const rzp = getRazorpayInstance();
    let razorpayOrder;
    try {
        razorpayOrder = await rzp.orders.create({
            amount: amountInPaise,
            currency: RAZORPAY_CURRENCY,
            receipt: order.orderNumber,
            notes: {
                orderId: order._id.toString(),
                orderNumber: order.orderNumber,
                userId,
            },
        });
    } catch (rzpErr) {
        // Razorpay order creation failed — restore stock and cancel the DB order
        logger.error(`Razorpay order creation failed: ${rzpErr.message}`);
        await rollbackPendingOrder(order._id);
        throw new Error("Failed to create payment order. Please try again.");
    }

    // ── 8. Save razorpayOrderId on the DB order ──────────────────────────────
    order.payment.razorpayOrderId = razorpayOrder.id;
    await order.save();

    logger.info(
        `Razorpay order created: ${razorpayOrder.id} for DB order ${order.orderNumber}`,
    );

    return {
        orderId: order._id,
        orderNumber: order.orderNumber,
        razorpayOrderId: razorpayOrder.id,
        amount: amountInPaise,
        currency: RAZORPAY_CURRENCY,
        keyId: process.env.RAZORPAY_KEY_ID,
    };
};

// ============================================================================
// VERIFY RAZORPAY PAYMENT (called from browser after payment succeeds)
// ============================================================================

/**
 * Verify the HMAC signature returned by Razorpay SDK, then confirm the order.
 *
 * This is the primary confirmation path (triggered from browser).
 * The webhook handler below is the fallback.
 *
 * @param {String} userId
 * @param {Object} paymentData - { razorpayOrderId, razorpayPaymentId, razorpaySignature }
 * @returns {Promise<Object>}
 */
export const verifyAndConfirmPayment = async (userId, paymentData) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } =
        paymentData;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        throw new Error(
            "razorpayOrderId, razorpayPaymentId and razorpaySignature are all required",
        );
    }

    // ── 1. Verify HMAC signature ─────────────────────────────────────────────
    const isValid = verifyPaymentSignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
    );

    if (!isValid) {
        logger.warn(
            `Invalid Razorpay signature for order ${razorpayOrderId} by user ${userId}`,
        );
        throw new Error("Payment verification failed: invalid signature");
    }

    // ── 2. Find the DB order ─────────────────────────────────────────────────
    const order = await Order.findOne({
        "payment.razorpayOrderId": razorpayOrderId,
        customer: userId,
    });

    if (!order) {
        throw new Error("Order not found for this payment");
    }

    // ── 3. Idempotency check ─────────────────────────────────────────────────
    if (order.payment.status === "paid") {
        // Already confirmed (webhook may have fired first)
        logger.info(
            `Order ${order.orderNumber} already confirmed — returning success`,
        );
        return { orderId: order._id, orderNumber: order.orderNumber };
    }

    // ── 4. Confirm the order ─────────────────────────────────────────────────
    await confirmOrder(order, razorpayPaymentId, razorpaySignature);

    // ── 5. Clear cart ────────────────────────────────────────────────────────
    await Cart.findOneAndUpdate({ userId }, { items: [] });

    // ── 6. Increment coupon usage (non-transactional — best-effort) ──────────
    if (order.appliedCoupon?.code) {
        try {
            await couponService.incrementCouponUsage(
                order.appliedCoupon.code,
                userId,
                order._id,
                order.appliedCoupon.discountAmount,
                order.pricing.itemsSubtotal,
            );
        } catch (couponErr) {
            logger.error(
                `Failed to increment coupon usage: ${couponErr.message}`,
            );
        }
    }

    logger.info(
        `Payment verified and order ${order.orderNumber} confirmed for user ${userId}`,
    );

    return { orderId: order._id, orderNumber: order.orderNumber };
};

// ============================================================================
// WEBHOOK — process server-to-server events from Razorpay
// ============================================================================

/**
 * Verify Razorpay webhook signature and process the event.
 * This is a safety-net for cases where the browser tab was closed
 * before verifyAndConfirmPayment could be called.
 *
 * Must receive the raw request body (Buffer) — not JSON.parsed.
 *
 * @param {Buffer} rawBody
 * @param {String} signature - x-razorpay-signature header
 * @returns {Promise<void>}
 */
export const handleWebhookEvent = async (rawBody, signature) => {
    // ── 1. Verify webhook signature ──────────────────────────────────────────
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
        throw new Error("RAZORPAY_WEBHOOK_SECRET is not set");
    }

    const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

    if (
        !crypto.timingSafeEqual(
            Buffer.from(expectedSignature, "hex"),
            Buffer.from(signature, "hex"),
        )
    ) {
        throw new Error("Invalid webhook signature");
    }

    const event = JSON.parse(rawBody.toString());
    const eventType = event.event;

    logger.info(`Razorpay webhook received: ${eventType}`);

    // ── 2. Route event ───────────────────────────────────────────────────────
    switch (eventType) {
        case "payment.captured": {
            await handlePaymentCaptured(event.payload.payment.entity);
            break;
        }

        case "payment.failed": {
            await handlePaymentFailed(event.payload.payment.entity);
            break;
        }

        case "refund.created": {
            await handleRefundCreated(event.payload.refund.entity);
            break;
        }

        default:
            logger.info(`Unhandled Razorpay webhook event: ${eventType}`);
    }
};

// ── Event: payment.captured ──────────────────────────────────────────────────

const handlePaymentCaptured = async (payment) => {
    const razorpayOrderId = payment.order_id;
    const razorpayPaymentId = payment.id;

    const order = await Order.findOne({
        "payment.razorpayOrderId": razorpayOrderId,
    });

    if (!order) {
        logger.warn(
            `Webhook: No order found for razorpayOrderId ${razorpayOrderId}`,
        );
        return;
    }

    if (order.payment.status === "paid") {
        logger.info(
            `Webhook: Order ${order.orderNumber} already paid — skipping`,
        );
        return;
    }

    await confirmOrder(order, razorpayPaymentId, null);

    // Clear cart
    await Cart.findOneAndUpdate({ userId: order.customer }, { items: [] });

    // Increment coupon usage
    if (order.appliedCoupon?.code) {
        try {
            await couponService.incrementCouponUsage(
                order.appliedCoupon.code,
                order.customer.toString(),
                order._id,
                order.appliedCoupon.discountAmount,
                order.pricing.itemsSubtotal,
            );
        } catch (err) {
            logger.error(
                `Webhook: Failed to increment coupon usage: ${err.message}`,
            );
        }
    }

    logger.info(
        `Webhook: Order ${order.orderNumber} confirmed via payment.captured`,
    );
};

// ── Event: payment.failed ────────────────────────────────────────────────────

const handlePaymentFailed = async (payment) => {
    const razorpayOrderId = payment.order_id;

    const order = await Order.findOne({
        "payment.razorpayOrderId": razorpayOrderId,
    });

    if (!order) {
        logger.warn(
            `Webhook: No order found for razorpayOrderId ${razorpayOrderId}`,
        );
        return;
    }

    if (order.payment.status !== "pending") {
        // Already resolved (paid or previously failed)
        return;
    }

    // Mark payment failed and cancel order
    order.payment.status = "failed";
    order.orderStatus = "cancelled";
    order.statusHistory.push({
        status: "cancelled",
        timestamp: new Date(),
        note: `Payment failed: ${payment.error_description || "Unknown error"}`,
    });
    await order.save();

    // Restore reserved stock
    await orderService.restoreStock(order.items);

    logger.info(
        `Webhook: Order ${order.orderNumber} cancelled due to payment failure`,
    );
};

// ── Event: refund.created ────────────────────────────────────────────────────

const handleRefundCreated = async (refund) => {
    const razorpayPaymentId = refund.payment_id;

    const order = await Order.findOne({
        "payment.razorpayPaymentId": razorpayPaymentId,
    });

    if (!order) {
        logger.warn(`Webhook: No order found for payment ${razorpayPaymentId}`);
        return;
    }

    order.payment.status = "refunded";
    await order.save();

    logger.info(`Webhook: Refund recorded for order ${order.orderNumber}`);
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Mark an order as paid and confirmed.
 * Used by both verifyAndConfirmPayment and the webhook handler.
 */
const confirmOrder = async (order, razorpayPaymentId, razorpaySignature) => {
    order.payment.status = "paid";
    order.payment.razorpayPaymentId = razorpayPaymentId;
    if (razorpaySignature) {
        order.payment.razorpaySignature = razorpaySignature;
    }
    order.payment.paidAt = new Date();
    order.orderStatus = "confirmed";
    order.statusHistory.push({
        status: "confirmed",
        timestamp: new Date(),
        note: "Payment confirmed",
    });
    await order.save();
};

/**
 * Verify Razorpay HMAC payment signature.
 * signature = HMAC-SHA256( razorpayOrderId + "|" + razorpayPaymentId, keySecret )
 */
export const verifyPaymentSignature = (
    razorpayOrderId,
    razorpayPaymentId,
    signature,
) => {
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

    try {
        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature, "hex"),
            Buffer.from(signature, "hex"),
        );
    } catch {
        return false;
    }
};

/**
 * Cancel a pending Razorpay order on modal dismiss / user abandonment.
 * Ownership is verified via userId — a user can only cancel their own orders.
 *
 * Safe to call multiple times; idempotent if the order is already resolved.
 *
 * @param {String} userId
 * @param {String} razorpayOrderId
 */
export const cancelPendingOrder = async (userId, razorpayOrderId) => {
    const order = await Order.findOne({
        "payment.razorpayOrderId": razorpayOrderId,
        customer: userId,
    });

    if (!order) {
        throw new Error("Order not found");
    }

    // If the order has already been paid (e.g. webhook arrived first), do nothing
    if (order.payment.status === "paid") {
        logger.info(
            `cancelPendingOrder: order ${order.orderNumber} already paid — ignoring cancel`,
        );
        return { alreadyPaid: true, orderNumber: order.orderNumber };
    }

    // If it's already been cancelled, silently succeed (idempotent)
    if (order.orderStatus === "cancelled") {
        return { alreadyPaid: false, orderNumber: order.orderNumber };
    }

    if (order.payment.status !== "pending") {
        throw new Error("Order cannot be cancelled in its current state");
    }

    await orderService.restoreStock(order.items);

    order.orderStatus = "cancelled";
    order.payment.status = "failed";
    order.statusHistory.push({
        status: "cancelled",
        timestamp: new Date(),
        note: "Cancelled by user — payment modal dismissed",
    });
    await order.save();

    logger.info(
        `Order ${order.orderNumber} cancelled and stock restored (modal dismissed)`,
    );

    return { alreadyPaid: false, orderNumber: order.orderNumber };
};

/**
 * Rollback a pending order when Razorpay order creation fails.
 * Restores stock and cancels the DB order.
 */
const rollbackPendingOrder = async (orderId) => {
    try {
        const order = await Order.findById(orderId);
        if (!order) return;

        await orderService.restoreStock(order.items);

        order.orderStatus = "cancelled";
        order.payment.status = "failed";
        order.statusHistory.push({
            status: "cancelled",
            timestamp: new Date(),
            note: "Rollback: Razorpay order creation failed",
        });
        await order.save();
    } catch (err) {
        logger.error(
            `Failed to rollback pending order ${orderId}: ${err.message}`,
        );
    }
};
