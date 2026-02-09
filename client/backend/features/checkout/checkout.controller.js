import * as checkoutService from "./checkout.service.js";
import apiResponse from "../../shared/utils/response.util.js";
import logger from "../../shared/utils/logger.util.js";

// ============================================================================
// CHECKOUT INITIATION
// ============================================================================

/**
 * Validate cart and calculate complete pricing for checkout
 * POST /api/checkout/initiate
 */
const initiateCheckout = async (req, res) => {
    try {
        const userId = req.user.userId;
        const checkoutData = req.body;

        // Validate required fields
        const { shippingAddressId, paymentMethod } = checkoutData;

        if (!shippingAddressId) {
            return apiResponse.badRequest(res, "Shipping address is required");
        }

        if (!paymentMethod) {
            return apiResponse.badRequest(res, "Payment method is required");
        }

        // Default billing address to shipping if not provided
        if (!checkoutData.billingAddressId) {
            checkoutData.billingAddressId = "same_as_shipping";
        }

        const result = await checkoutService.initiateCheckout(
            userId,
            checkoutData,
        );

        if (!result.isValid) {
            return apiResponse.badRequest(res, "Cart validation failed", null, {
                warnings: result.warnings,
            });
        }

        return apiResponse.success(
            res,
            result,
            "Checkout initiated successfully",
        );
    } catch (error) {
        logger.error(`Error initiating checkout: ${error.message}`);

        if (error.message.includes("not found")) {
            return apiResponse.notFound(res, error.message);
        }

        if (error.message.includes("Cart is empty")) {
            return apiResponse.badRequest(res, "Cart is empty");
        }

        if (error.message.includes("COD not available")) {
            return apiResponse.badRequest(res, error.message);
        }

        return apiResponse.serverError(res, "Failed to initiate checkout");
    }
};

// ============================================================================
// PLACE ORDER - COD
// ============================================================================

/**
 * Place order with Cash on Delivery payment method
 * POST /api/checkout/place-order-cod
 */
const placeOrderCOD = async (req, res) => {
    try {
        const userId = req.user.userId;
        const checkoutData = req.body;

        // Validate required fields
        const { shippingAddressId, paymentMethod } = checkoutData;

        if (!shippingAddressId) {
            return apiResponse.badRequest(res, "Shipping address is required");
        }

        if (paymentMethod !== "cod") {
            return apiResponse.badRequest(
                res,
                "Invalid payment method for this endpoint",
            );
        }

        // Default billing address to shipping if not provided
        if (!checkoutData.billingAddressId) {
            checkoutData.billingAddressId = "same_as_shipping";
        }

        const order = await checkoutService.placeOrderCOD(userId, checkoutData);

        logger.info(`COD order placed: ${order.orderNumber} by user ${userId}`);

        return apiResponse.created(
            res,
            {
                orderId: order._id,
                orderNumber: order.orderNumber,
                status: order.orderStatus,
                paymentMethod: order.payment.method,
                total: order.pricing.total,
            },
            "Order placed successfully",
        );
    } catch (error) {
        logger.error(`Error placing COD order: ${error.message}`);

        if (error.message.includes("not found")) {
            return apiResponse.notFound(res, error.message);
        }

        if (error.message.includes("Cart is empty")) {
            return apiResponse.badRequest(res, "Cart is empty");
        }

        if (error.message.includes("validation failed")) {
            return apiResponse.badRequest(
                res,
                "Cart items are invalid or out of stock",
            );
        }

        if (error.message.includes("COD not available")) {
            return apiResponse.badRequest(res, error.message);
        }

        if (error.message.includes("Insufficient stock")) {
            return apiResponse.badRequest(res, "Some items are out of stock");
        }

        return apiResponse.serverError(res, "Failed to place order");
    }
};

// ============================================================================
// EXPORTS
// ============================================================================

export { initiateCheckout, placeOrderCOD };
