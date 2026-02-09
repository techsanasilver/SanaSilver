import mongoose from "mongoose";
import Cart from "../cart/cart.model.js";
import Product from "../products/product.model.js";
import ProductVariant from "../products/product-variant.model.js";
import User from "../auth/user.model.js";
import * as orderService from "../orders/order.service.js";
import * as pricing from "../../shared/utils/pricing.util.js";
import logger from "../../shared/utils/logger.util.js";

// ============================================================================
// CHECKOUT SERVICE
// ============================================================================
//
// PRICING STRATEGY:
// - Uses pre-calculated values from variant.priceBreakdown (calculated at variant creation)
// - Applies GST on discounted amounts (discount-then-tax model)
// - Distributes cart-level discounts proportionally across items
//
// COUPON SUPPORT:
// - Infrastructure ready for coupon integration
// - Accepts optional couponCode parameter
// - Uses pricing.calculateDiscount() and pricing.distributeDiscountProportionally()
// - TODO: Uncomment coupon validation code when Coupon model is ready
//
// ============================================================================
// INITIATE CHECKOUT
// ============================================================================

/**
 * Validate and calculate complete pricing for checkout
 * @param {String} userId - User ID
 * @param {Object} checkoutData - Checkout data
 * @returns {Promise<Object>} Validated checkout data with pricing
 */
const initiateCheckout = async (userId, checkoutData) => {
    try {
        const {
            shippingAddressId,
            billingAddressId,
            paymentMethod,
            customerNote,
        } = checkoutData;

        // 1. Validate user and addresses
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }

        const shippingAddress = user.addresses.id(shippingAddressId);
        if (!shippingAddress) {
            throw new Error("Shipping address not found");
        }

        let billingAddress;
        if (billingAddressId === "same_as_shipping") {
            billingAddress = shippingAddress;
        } else {
            billingAddress = user.addresses.id(billingAddressId);
            if (!billingAddress) {
                throw new Error("Billing address not found");
            }
        }

        // 2. Get cart
        const cart = await Cart.findOne({ userId })
            .populate({
                path: "items.productId",
                select: "name images purity makingChargesPerGram gstRate",
            })
            .populate({
                path: "items.variantId",
                select: "sku size color weight price stockQuantity images gemstoneCharges",
            });

        if (!cart || cart.items.length === 0) {
            throw new Error("Cart is empty");
        }

        // 3. Validate stock and calculate pricing
        const { items, pricing, warnings } = await calculateCheckoutPricing(
            cart.items,
            checkoutData.couponCode || null,
        );

        // 4. Validate payment method
        if (!["razorpay", "cod"].includes(paymentMethod)) {
            throw new Error("Invalid payment method");
        }

        // 5. Check COD eligibility
        if (paymentMethod === "cod") {
            const codCheck = await validateCODEligibility(
                userId,
                pricing.total,
            );
            if (!codCheck.allowed) {
                throw new Error(codCheck.reason);
            }
        }

        // 6. Format addresses for response
        const formattedShippingAddress = {
            name: shippingAddress.name,
            phone: shippingAddress.phone,
            line1: shippingAddress.addressLine1,
            line2: shippingAddress.addressLine2,
            city: shippingAddress.city,
            state: shippingAddress.state,
            pincode: shippingAddress.pincode,
        };

        const formattedBillingAddress =
            billingAddressId === "same_as_shipping"
                ? formattedShippingAddress
                : {
                      name: billingAddress.name,
                      phone: billingAddress.phone,
                      line1: billingAddress.addressLine1,
                      line2: billingAddress.addressLine2,
                      city: billingAddress.city,
                      state: billingAddress.state,
                      pincode: billingAddress.pincode,
                  };

        return {
            items,
            addresses: {
                shipping: formattedShippingAddress,
                billing: formattedBillingAddress,
            },
            pricing,
            paymentMethod,
            customerNote: customerNote || "",
            isValid: warnings.length === 0,
            warnings,
        };
    } catch (error) {
        logger.error(`Error initiating checkout: ${error.message}`);
        throw error;
    }
};

/**
 * Calculate pricing for all cart items
 * @param {Array} cartItems - Cart items with populated product/variant
 * @param {String} couponCode - Optional coupon code (for future coupon support)
 * @returns {Promise<Object>} Items with pricing and summary
 */
const calculateCheckoutPricing = async (cartItems, couponCode = null) => {
    const items = [];
    const warnings = [];
    let itemsSubtotal = 0;

    for (const cartItem of cartItems) {
        const product = cartItem.productId;
        const variant = cartItem.variantId;

        // Validate product and variant exist
        if (!product || !variant) {
            warnings.push({
                item: cartItem._id,
                issue: "Product or variant not found",
            });
            continue;
        }

        // Check stock availability
        if (variant.stockQuantity < cartItem.quantity) {
            warnings.push({
                productName: product.name,
                sku: variant.sku,
                requested: cartItem.quantity,
                available: variant.stockQuantity,
                issue: "Insufficient stock",
            });
            continue;
        }

        // Use pre-calculated values from variant's priceBreakdown
        // These are already calculated when variant is created/updated
        const priceBreakdown = variant.priceBreakdown || {};

        const metalValue = priceBreakdown.metalValue || 0;
        const makingCharges = priceBreakdown.makingCharges || 0;
        const gemstoneCharges = priceBreakdown.gemstoneCharges || 0;
        const itemSubtotal =
            priceBreakdown.subtotal ||
            metalValue + makingCharges + gemstoneCharges;
        const gstRate =
            priceBreakdown.gstRate || product.gstRate || pricing.GST_RATE;

        // Calculate total for quantity
        const quantitySubtotal = itemSubtotal * cartItem.quantity;
        itemsSubtotal += quantitySubtotal;

        items.push({
            product: {
                _id: product._id,
                name: product.name,
                images: product.images,
                purity: product.purity,
            },
            variant: {
                _id: variant._id,
                sku: variant.sku,
                size: variant.size,
                color: variant.color,
                weight: variant.weight,
                price: variant.price,
                stockQuantity: variant.stockQuantity,
                images: variant.images,
            },
            quantity: cartItem.quantity,
            weight: variant.weight,
            metalValue: pricing.roundPrice(metalValue),
            makingCharges: pricing.roundPrice(makingCharges),
            gemstoneCharges: pricing.roundPrice(gemstoneCharges),
            subtotal: pricing.roundPrice(quantitySubtotal),
            gstRate,
        });
    }

    // Calculate cart-level discount (coupon support)
    let cartDiscount = 0;
    let couponInfo = null;

    // TODO: When coupon system is implemented:
    // if (couponCode) {
    //     const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
    //     if (coupon && validateCouponEligibility(coupon, itemsSubtotal)) {
    //         cartDiscount = pricing.calculateDiscount(itemsSubtotal, coupon);
    //         couponInfo = {
    //             code: coupon.code,
    //             description: coupon.description,
    //             discountType: coupon.discountType,
    //             discountValue: coupon.discountValue,
    //             discountApplied: cartDiscount
    //         };
    //     }
    // }

    // Distribute discount proportionally across items
    const itemsWithDiscount = pricing.distributeDiscountProportionally(
        items,
        cartDiscount,
    );

    // Calculate GST on discounted amounts
    itemsWithDiscount.forEach((item) => {
        const gstAmount = pricing.calculateGST(
            item.discountedSubtotal || item.subtotal,
            item.gstRate,
        );
        item.gstAmount = pricing.roundPrice(gstAmount);
        item.total = pricing.roundPrice(
            (item.discountedSubtotal || item.subtotal) + gstAmount,
        );
    });

    // Calculate cart-level pricing
    const discountedSubtotal = itemsSubtotal - cartDiscount;
    const shippingCharges =
        pricing.calculateShippingCharges(discountedSubtotal);
    const taxableAmount = discountedSubtotal + shippingCharges;
    const gst = itemsWithDiscount.reduce(
        (sum, item) => sum + item.gstAmount,
        0,
    );
    const total = taxableAmount + gst;

    const pricingSummary = {
        itemsSubtotal: pricing.roundPrice(itemsSubtotal),
        discount: pricing.roundPrice(cartDiscount),
        discountedSubtotal: pricing.roundPrice(discountedSubtotal),
        shippingCharges: pricing.roundPrice(shippingCharges),
        taxableAmount: pricing.roundPrice(taxableAmount),
        gst: pricing.roundPrice(gst),
        total: pricing.roundPrice(total),
    };

    // Add coupon info if applied
    if (couponInfo) {
        pricingSummary.coupon = couponInfo;
    }

    return { items: itemsWithDiscount, pricing: pricingSummary, warnings };
};

// ============================================================================
// PLACE ORDER (COD)
// ============================================================================

/**
 * Place order with Cash on Delivery payment method
 * @param {String} userId - User ID
 * @param {Object} checkoutData - Checkout data
 * @returns {Promise<Object>} Created order
 */
const placeOrderCOD = async (userId, checkoutData) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Validate checkout data
        const validatedData = await initiateCheckout(userId, checkoutData);

        if (!validatedData.isValid) {
            throw new Error(
                "Cart validation failed: " +
                    JSON.stringify(validatedData.warnings),
            );
        }

        // 2. Prepare order data
        const orderItems = validatedData.items.map((item) => ({
            product: item.product._id,
            variant: item.variant._id,
            productName: item.product.name,
            sku: item.variant.sku,
            image: item.variant.images?.[0] || item.product.images?.[0],
            quantity: item.quantity,
            weight: item.weight,
            metalValue: item.metalValue,
            makingCharges: item.makingCharges,
            gemstoneCharges: item.gemstoneCharges,
            subtotal: item.subtotal / item.quantity, // Per unit
            discount: item.discount,
            discountedSubtotal: item.discountedSubtotal / item.quantity, // Per unit
            gstRate: item.gstRate,
            gstAmount: item.gstAmount,
            total: item.total,
        }));

        const orderData = {
            customer: userId,
            items: orderItems,
            shippingAddress: validatedData.addresses.shipping,
            billingAddress: validatedData.addresses.billing,
            pricing: validatedData.pricing,
            payment: {
                method: "cod",
                status: "pending",
            },
            orderStatus: "confirmed", // COD orders are confirmed immediately
            customerNote: validatedData.customerNote,
        };

        // 3. Create order
        const order = await orderService.createOrder(orderData, session);

        // 4. Reduce stock
        await orderService.reduceStock(orderItems, session);

        // 5. Clear cart
        await Cart.findOneAndUpdate({ userId }, { items: [] }, { session });

        await session.commitTransaction();

        logger.info(
            `COD Order created: ${order.orderNumber} for user ${userId}`,
        );

        return order;
    } catch (error) {
        await session.abortTransaction();
        logger.error(`Error placing COD order: ${error.message}`);
        throw error;
    } finally {
        session.endSession();
    }
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate COD eligibility
 * @param {String} userId - User ID
 * @param {Number} orderTotal - Order total amount
 * @returns {Promise<Object>} Validation result
 */
const validateCODEligibility = async (userId, orderTotal) => {
    // Rule 1: Max order value
    if (orderTotal > pricing.COD_MAX_ORDER_VALUE) {
        return {
            allowed: false,
            reason: `COD not available for orders above ₹${pricing.COD_MAX_ORDER_VALUE.toLocaleString()}`,
        };
    }

    // Rule 2: Check failed COD delivery history (future enhancement)
    // const failedCODCount = await Order.countDocuments({
    //     customer: userId,
    //     'payment.method': 'cod',
    //     orderStatus: 'cancelled',
    //     'statusHistory.note': /customer.*refused|unavailable/i
    // });
    // if (failedCODCount >= 3) {
    //     return {
    //         allowed: false,
    //         reason: 'COD not available due to past failed deliveries'
    //     };
    // }

    return { allowed: true };
};

// ============================================================================
// EXPORTS
// ============================================================================

export { initiateCheckout, placeOrderCOD, calculateCheckoutPricing };
