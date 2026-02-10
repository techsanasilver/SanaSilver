import express from "express";
import * as couponController from "./coupon.controller.js";
import authMiddleware from "../../shared/middlewares/auth.middleware.js";
import { requirePermission } from "../../shared/middlewares/role.middleware.js";

const router = express.Router();

// ============================================================================
// COUPON MANAGEMENT ROUTES (All Protected)
// ============================================================================

/**
 * Get all coupons with filters and pagination
 * GET /api/coupons
 */
router.get(
    "/",
    authMiddleware,
    requirePermission("coupons.view"),
    couponController.getAll,
);

/**
 * Get coupon by code
 * GET /api/coupons/code/:code
 */
router.get(
    "/code/:code",
    authMiddleware,
    requirePermission("coupons.view"),
    couponController.getByCode,
);

/**
 * Create new coupon
 * POST /api/coupons
 */
router.post(
    "/",
    authMiddleware,
    requirePermission("coupons.create"),
    couponController.create,
);

/**
 * Get coupon by ID
 * GET /api/coupons/:id
 */
router.get(
    "/:id",
    authMiddleware,
    requirePermission("coupons.view"),
    couponController.getById,
);

/**
 * Update coupon
 * PUT /api/coupons/:id
 */
router.put(
    "/:id",
    authMiddleware,
    requirePermission("coupons.edit"),
    couponController.update,
);

/**
 * Delete coupon
 * DELETE /api/coupons/:id
 */
router.delete(
    "/:id",
    authMiddleware,
    requirePermission("coupons.delete"),
    couponController.deleteCoupon,
);

/**
 * Toggle coupon active status
 * PATCH /api/coupons/:id/toggle-status
 */
router.patch(
    "/:id/toggle-status",
    authMiddleware,
    requirePermission("coupons.edit"),
    couponController.toggleStatus,
);

/**
 * Get coupon statistics
 * GET /api/coupons/:id/stats
 */
router.get(
    "/:id/stats",
    authMiddleware,
    requirePermission("coupons.view"),
    couponController.getStats,
);

/**
 * Get coupon usage history
 * GET /api/coupons/:id/usage-history
 */
router.get(
    "/:id/usage-history",
    authMiddleware,
    requirePermission("coupons.view"),
    couponController.getUsageHistory,
);

/**
 * Duplicate coupon
 * POST /api/coupons/:id/duplicate
 */
router.post(
    "/:id/duplicate",
    authMiddleware,
    requirePermission("coupons.create"),
    couponController.duplicate,
);

export default router;
