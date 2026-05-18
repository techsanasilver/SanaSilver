import express from "express";
import authMiddleware from "../../shared/middlewares/auth.middleware.js";
import { requirePermission } from "../../shared/middlewares/role.middleware.js";
import {
    getSummary,
    getRevenueTrend,
    getTopProducts,
} from "./analytics.controller.js";

const router = express.Router();

router.use(authMiddleware);

/**
 * @route   GET /api/analytics/summary
 * @desc    KPIs, order status, payment method split, review stats
 * @access  Admin (orders.view)
 * @query   period — today | week | month | year | all  (default: month)
 */
router.get("/summary", requirePermission("orders.view"), getSummary);

/**
 * @route   GET /api/analytics/revenue-trend
 * @desc    Daily revenue + order count for the last N days
 * @access  Admin (orders.view)
 * @query   days — 7 | 14 | 30 | 90 | 365  (default: 30, capped at 365)
 */
router.get("/revenue-trend", requirePermission("orders.view"), getRevenueTrend);

/**
 * @route   GET /api/analytics/top-products
 * @desc    Top products by revenue from order history
 * @access  Admin (orders.view)
 * @query   limit — 1-20  (default: 8)
 */
router.get("/top-products", requirePermission("orders.view"), getTopProducts);

export default router;
