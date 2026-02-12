import express from "express";
import * as orderController from "./order.controller.js";
import authMiddleware from "../../shared/middlewares/auth.middleware.js";
import requirePermission from "../../shared/middlewares/permission.middleware.js";

const router = express.Router();

// ============================================================================
// ADMIN ORDER ROUTES (All Protected + Permission-Based)
// ============================================================================

/**
 * @route   GET /api/orders
 * @desc    Get all orders with filters and pagination
 * @access  Admin (orders.view)
 * @query   page, limit, status, paymentStatus, startDate, endDate, searchTerm
 */
router.get(
    "/",
    authMiddleware,
    requirePermission("orders.view"),
    orderController.getAllOrders,
);

/**
 * @route   GET /api/orders/stats
 * @desc    Get order statistics for dashboard
 * @access  Admin (orders.view)
 * @query   period (today, week, month, all)
 */
router.get(
    "/stats",
    authMiddleware,
    requirePermission("orders.view"),
    orderController.getOrderStats,
);

/**
 * @route   GET /api/orders/refund-pending
 * @desc    Get orders needing refund processing
 * @access  Admin (orders.view)
 */
router.get(
    "/refund-pending",
    authMiddleware,
    requirePermission("orders.view"),
    orderController.getRefundPendingOrders,
);

/**
 * @route   GET /api/orders/:orderId
 * @desc    Get single order details
 * @access  Admin (orders.view)
 */
router.get(
    "/:orderId",
    authMiddleware,
    requirePermission("orders.view"),
    orderController.getOrderById,
);

/**
 * @route   PATCH /api/orders/:orderId/status
 * @desc    Update order status
 * @access  Admin (orders.edit)
 * @body    { status: "confirmed", note: "Optional note" }
 */
router.patch(
    "/:orderId/status",
    authMiddleware,
    requirePermission("orders.edit"),
    orderController.updateOrderStatus,
);

/**
 * @route   PATCH /api/orders/:orderId/shipping
 * @desc    Add shipping details to order
 * @access  Admin (orders.edit)
 * @body    { courier: "BlueDart", trackingNumber: "BD123456", estimatedDelivery: "2026-02-15" }
 */
router.patch(
    "/:orderId/shipping",
    authMiddleware,
    requirePermission("orders.edit"),
    orderController.addShippingDetails,
);

/**
 * @route   POST /api/orders/:orderId/mark-delivered
 * @desc    Mark order as delivered
 * @access  Admin (orders.edit)
 */
router.post(
    "/:orderId/mark-delivered",
    authMiddleware,
    requirePermission("orders.edit"),
    orderController.markAsDelivered,
);

/**
 * @route   POST /api/orders/:orderId/cancel
 * @desc    Cancel order (admin override)
 * @access  Admin (orders.delete)
 * @body    { reason: "Customer requested" }
 */
router.post(
    "/:orderId/cancel",
    authMiddleware,
    requirePermission("orders.delete"),
    orderController.cancelOrder,
);

/**
 * @route   POST /api/orders/:orderId/notes
 * @desc    Add internal admin note to order
 * @access  Admin (orders.edit)
 * @body    { note: "Customer called, delivery address confirmed" }
 */
router.post(
    "/:orderId/notes",
    authMiddleware,
    requirePermission("orders.edit"),
    orderController.addAdminNote,
);

// ============================================================================
// EXPORT ROUTER
// ============================================================================

export default router;
