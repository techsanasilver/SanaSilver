import express from "express";
import * as couponController from "./coupon.controller.js";
import authMiddleware from "../../shared/middlewares/auth.middleware.js";

const router = express.Router();

// ============================================================================
// CUSTOMER ROUTES (Protected)
// ============================================================================

/**
 * Get all available coupons for the user
 * GET /api/coupons/available
 */
router.get("/available", authMiddleware, couponController.getAvailableCoupons);

/**
 * Validate a coupon code
 * POST /api/coupons/validate
 */
router.post("/validate", authMiddleware, couponController.validateCouponCode);

/**
 * Apply coupon to cart (preview)
 * POST /api/coupons/apply
 */
router.post("/apply", authMiddleware, couponController.applyCoupon);

/**
 * Remove coupon from cart
 * POST /api/coupons/remove
 */
router.post("/remove", authMiddleware, couponController.removeCoupon);

export default router;
