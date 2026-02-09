import express from "express";
import * as checkoutController from "./checkout.controller.js";
import authMiddleware from "../../shared/middlewares/auth.middleware.js";

const router = express.Router();

// ============================================================================
// CHECKOUT ROUTES (All Protected)
// ============================================================================

/**
 * @route   POST /api/checkout/initiate
 * @desc    Validate cart and calculate complete pricing for checkout
 * @access  Protected
 * @body    {
 *            shippingAddressId: String,
 *            billingAddressId: String | "same_as_shipping",
 *            paymentMethod: "razorpay" | "cod",
 *            customerNote: String (optional)
 *          }
 */
router.post("/initiate", authMiddleware, checkoutController.initiateCheckout);

/**
 * @route   POST /api/checkout/place-order-cod
 * @desc    Place order with Cash on Delivery payment method
 * @access  Protected
 * @body    {
 *            shippingAddressId: String,
 *            billingAddressId: String | "same_as_shipping",
 *            paymentMethod: "cod",
 *            customerNote: String (optional)
 *          }
 */
router.post(
    "/place-order-cod",
    authMiddleware,
    checkoutController.placeOrderCOD,
);

// ============================================================================
// EXPORT ROUTER
// ============================================================================

export default router;
