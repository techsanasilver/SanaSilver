import * as razorpayService from "./razorpay.service.js";
import apiResponse from "../../shared/utils/response.util.js";
import logger from "../../shared/utils/logger.util.js";
import { RAZORPAY_ENABLED } from "./payment.config.js";

// ============================================================================
// GUARD — returns 503 when Razorpay is toggled off
// ============================================================================

const checkEnabled = (res) => {
    if (!RAZORPAY_ENABLED) {
        apiResponse.serverError(
            res,
            "Online payment is currently unavailable. Please use Cash on Delivery.",
        );
        return false;
    }
    return true;
};

// ============================================================================
// CREATE RAZORPAY ORDER
// ============================================================================

/**
 * POST /api/razorpay/create-order
 *
 * Validates cart, creates a pending DB order, reserves stock,
 * and returns a Razorpay order for the frontend to open the checkout modal.
 */
const createOrder = async (req, res) => {
    if (!checkEnabled(res)) return;

    try {
        const userId = req.user.userId;
        const {
            shippingAddressId,
            billingAddressId,
            couponCode,
            customerNote,
        } = req.body;

        if (!shippingAddressId) {
            return apiResponse.badRequest(res, "Shipping address is required");
        }

        const result = await razorpayService.createRazorpayOrder(userId, {
            shippingAddressId,
            billingAddressId: billingAddressId || "same_as_shipping",
            couponCode,
            customerNote,
        });

        return apiResponse.success(res, "Razorpay order created", result);
    } catch (error) {
        logger.error(`Error creating Razorpay order: ${error.message}`);

        if (error.message.includes("not found")) {
            return apiResponse.notFound(res, error.message);
        }
        if (error.message.includes("Cart is empty")) {
            return apiResponse.badRequest(res, "Cart is empty");
        }
        if (error.message.includes("out of stock")) {
            return apiResponse.badRequest(res, error.message);
        }

        return apiResponse.serverError(res, "Failed to create payment order");
    }
};

// ============================================================================
// VERIFY PAYMENT
// ============================================================================

/**
 * POST /api/razorpay/verify-payment
 *
 * Called from the browser after the Razorpay modal completes successfully.
 * Verifies the HMAC signature and confirms the order.
 */
const verifyPayment = async (req, res) => {
    if (!checkEnabled(res)) return;

    try {
        const userId = req.user.userId;
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } =
            req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return apiResponse.badRequest(
                res,
                "razorpayOrderId, razorpayPaymentId and razorpaySignature are required",
            );
        }

        const result = await razorpayService.verifyAndConfirmPayment(userId, {
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
        });

        return apiResponse.success(res, "Payment verified successfully", {
            orderId: result.orderId,
            orderNumber: result.orderNumber,
        });
    } catch (error) {
        logger.error(`Error verifying Razorpay payment: ${error.message}`);

        if (error.message.includes("invalid signature")) {
            return apiResponse.badRequest(res, "Payment verification failed");
        }
        if (error.message.includes("not found")) {
            return apiResponse.notFound(res, error.message);
        }

        return apiResponse.serverError(res, "Failed to verify payment");
    }
};

// ============================================================================
// CANCEL PENDING ORDER (modal dismissed / user abandoned)
// ============================================================================

/**
 * DELETE /api/razorpay/pending-order
 *
 * Called from the frontend ondismiss callback.
 * Cancels the pending DB order and restores reserved stock.
 * Idempotent — safe to call even if webhook already resolved the order.
 */
const cancelOrder = async (req, res) => {
    if (!checkEnabled(res)) return;

    try {
        const userId = req.user.userId;
        const { razorpayOrderId } = req.body;

        if (!razorpayOrderId) {
            return apiResponse.badRequest(res, "razorpayOrderId is required");
        }

        const result = await razorpayService.cancelPendingOrder(
            userId,
            razorpayOrderId,
        );

        return apiResponse.success(
            res,
            result.alreadyPaid
                ? "Order already paid — no changes made"
                : "Order cancelled and stock restored",
            { orderNumber: result.orderNumber },
        );
    } catch (error) {
        logger.error(`Error cancelling pending order: ${error.message}`);

        if (error.message === "Order not found") {
            return apiResponse.notFound(res, "Order not found");
        }
        if (error.message.includes("cannot be cancelled")) {
            return apiResponse.badRequest(res, error.message);
        }

        return apiResponse.serverError(res, "Failed to cancel order");
    }
};

// ============================================================================
// EXPORTS
// ============================================================================

export { createOrder, verifyPayment, cancelOrder };
