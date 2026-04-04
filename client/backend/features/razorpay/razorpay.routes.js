import express from "express";
import * as razorpayController from "./razorpay.controller.js";
import authMiddleware from "../../shared/middlewares/auth.middleware.js";

const router = express.Router();

// ============================================================================
// RAZORPAY ROUTES
// ============================================================================

/**
 * @route   POST /api/razorpay/create-order
 * @desc    Validate cart, create pending DB order, reserve stock,
 *          return Razorpay order details for the frontend modal
 * @access  Protected
 * @body    {
 *            shippingAddressId: String,
 *            billingAddressId?: String | "same_as_shipping",
 *            couponCode?: String,
 *            customerNote?: String
 *          }
 */
router.post("/create-order", authMiddleware, razorpayController.createOrder);

/**
 * @route   POST /api/razorpay/verify-payment
 * @desc    Verify Razorpay HMAC signature and confirm the order
 * @access  Protected
 * @body    {
 *            razorpayOrderId: String,
 *            razorpayPaymentId: String,
 *            razorpaySignature: String
 *          }
 */
router.post(
    "/verify-payment",
    authMiddleware,
    razorpayController.verifyPayment,
);

/**
 * @route   DELETE /api/razorpay/pending-order
 * @desc    Cancel a pending Razorpay order (modal dismissed / abandoned).
 *          Restores reserved stock. Idempotent if already resolved.
 * @access  Protected
 * @body    { razorpayOrderId: String }
 */
router.delete("/pending-order", authMiddleware, razorpayController.cancelOrder);

// ============================================================================
// EXPORT ROUTER
// ============================================================================

export default router;
