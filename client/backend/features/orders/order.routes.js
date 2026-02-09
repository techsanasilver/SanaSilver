import express from "express";
import * as orderController from "./order.controller.js";
import authMiddleware from "../../shared/middlewares/auth.middleware.js";

const router = express.Router();

// ============================================================================
// ORDER ROUTES (All Protected)
// ============================================================================

/**
 * @route   GET /api/orders
 * @desc    Get customer's orders with pagination
 * @access  Protected
 * @query   page, limit, status, startDate, endDate
 */
router.get("/", authMiddleware, orderController.getMyOrders);

/**
 * @route   GET /api/orders/stats
 * @desc    Get customer's order statistics
 * @access  Protected
 */
router.get("/stats", authMiddleware, orderController.getMyStats);

/**
 * @route   GET /api/orders/number/:orderNumber
 * @desc    Get order by order number
 * @access  Protected
 */
router.get(
    "/number/:orderNumber",
    authMiddleware,
    orderController.getOrderByNumber,
);

/**
 * @route   GET /api/orders/:orderId
 * @desc    Get single order details
 * @access  Protected
 */
router.get("/:orderId", authMiddleware, orderController.getOrderDetails);

/**
 * @route   POST /api/orders/:orderId/cancel
 * @desc    Cancel an order
 * @access  Protected
 * @body    { reason: "Changed my mind" }
 */
router.post("/:orderId/cancel", authMiddleware, orderController.cancelOrder);

/**
 * @route   GET /api/orders/:orderId/track
 * @desc    Get order tracking information
 * @access  Protected
 */
router.get("/:orderId/track", authMiddleware, orderController.trackOrder);

// ============================================================================
// EXPORT ROUTER
// ============================================================================

export default router;
