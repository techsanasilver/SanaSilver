import * as orderService from "./order.service.js";
import apiResponse from "../../shared/utils/response.util.js";
import logger from "../../shared/utils/logger.util.js";

// ============================================================================
// GET ORDERS
// ============================================================================

/**
 * Get all orders with filters and pagination
 * GET /api/orders
 */
const getAllOrders = async (req, res) => {
    try {
        const {
            page,
            limit,
            status,
            paymentStatus,
            startDate,
            endDate,
            searchTerm,
        } = req.query;

        const filters = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            status,
            paymentStatus,
            startDate,
            endDate,
            searchTerm,
        };

        const result = await orderService.getAllOrders(filters);

        return apiResponse.successWithPagination(
            res,
            "Orders retrieved successfully",
            result.orders,
            result.pagination,
        );
    } catch (error) {
        logger.error(`Error fetching orders: ${error.message}`);
        return apiResponse.serverError(res, "Failed to fetch orders");
    }
};

/**
 * Get order statistics
 * GET /api/orders/stats
 */
const getOrderStats = async (req, res) => {
    try {
        const { period = "all" } = req.query; // today, week, month, all

        const stats = await orderService.getOrderStats(period);

        return apiResponse.success(
            res,
            "Order statistics retrieved successfully",
            stats,
        );
    } catch (error) {
        logger.error(`Error fetching order stats: ${error.message}`);
        return apiResponse.serverError(res, "Failed to fetch statistics");
    }
};

/**
 * Get single order details
 * GET /api/orders/:orderId
 */
const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await orderService.getOrderById(orderId);

        return apiResponse.success(res, "Order retrieved successfully", order);
    } catch (error) {
        logger.error(`Error fetching order: ${error.message}`);

        if (error.message === "Order not found") {
            return apiResponse.notFound(res, "Order not found");
        }

        return apiResponse.serverError(res, "Failed to fetch order");
    }
};

// ============================================================================
// UPDATE ORDER STATUS
// ============================================================================

/**
 * Update order status
 * PATCH /api/orders/:orderId/status
 */
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, note } = req.body;
        const adminId = req.admin._id;

        if (!status) {
            return apiResponse.badRequest(res, "Status is required");
        }

        const validStatuses = [
            "pending",
            "confirmed",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
        ];

        if (!validStatuses.includes(status)) {
            return apiResponse.badRequest(res, "Invalid status");
        }

        const order = await orderService.updateOrderStatus(
            orderId,
            status,
            adminId,
            note,
        );

        return apiResponse.success(
            res,
            `Order status updated to ${status}`,
            order,
        );
    } catch (error) {
        logger.error(`Error updating order status: ${error.message}`);

        if (
            error.message.includes("Cannot transition") ||
            error.message.includes("already in") ||
            error.message === "Order not found"
        ) {
            return apiResponse.badRequest(res, error.message);
        }

        return apiResponse.serverError(res, "Failed to update order status");
    }
};

/**
 * Add shipping details
 * PATCH /api/orders/:orderId/shipping
 */
const addShippingDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { courier, trackingNumber, estimatedDelivery } = req.body;
        const adminId = req.admin._id;

        if (!courier || !trackingNumber) {
            return apiResponse.badRequest(
                res,
                "Courier and tracking number are required",
            );
        }

        const order = await orderService.addShippingDetails(
            orderId,
            { courier, trackingNumber, estimatedDelivery },
            adminId,
        );

        return apiResponse.success(
            res,
            "Shipping details added successfully",
            order,
        );
    } catch (error) {
        logger.error(`Error adding shipping details: ${error.message}`);

        if (error.message === "Order not found") {
            return apiResponse.notFound(res, "Order not found");
        }

        if (
            error.message.includes("already been delivered") ||
            error.message.includes("Cannot add shipping")
        ) {
            return apiResponse.badRequest(res, error.message);
        }

        return apiResponse.serverError(res, "Failed to add shipping details");
    }
};

/**
 * Mark order as delivered
 * POST /api/orders/:orderId/mark-delivered
 */
const markAsDelivered = async (req, res) => {
    try {
        const { orderId } = req.params;
        const adminId = req.admin._id;

        const order = await orderService.markAsDelivered(orderId, adminId);

        return apiResponse.success(
            res,
            "Order marked as delivered successfully",
            order,
        );
    } catch (error) {
        logger.error(`Error marking order as delivered: ${error.message}`);

        if (
            error.message === "Order not found" ||
            error.message.includes("Only shipped orders")
        ) {
            return apiResponse.badRequest(res, error.message);
        }

        return apiResponse.serverError(
            res,
            "Failed to mark order as delivered",
        );
    }
};

// ============================================================================
// CANCELLATION & NOTES
// ============================================================================

/**
 * Cancel order (admin override)
 * POST /api/orders/:orderId/cancel
 */
const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;
        const adminId = req.admin._id;

        if (!reason || reason.trim() === "") {
            return apiResponse.badRequest(
                res,
                "Cancellation reason is required",
            );
        }

        const result = await orderService.cancelOrderByAdmin(
            orderId,
            reason,
            adminId,
        );

        return apiResponse.success(res, "Order cancelled successfully", result);
    } catch (error) {
        logger.error(`Error cancelling order: ${error.message}`);

        if (
            error.message === "Order not found" ||
            error.message.includes("cannot cancel") ||
            error.message.includes("already cancelled") ||
            error.message.includes("Cannot cancel")
        ) {
            return apiResponse.badRequest(res, error.message);
        }

        return apiResponse.serverError(res, "Failed to cancel order");
    }
};

/**
 * Add admin note to order
 * POST /api/orders/:orderId/notes
 */
const addAdminNote = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { note } = req.body;
        const adminId = req.admin._id;

        if (!note || note.trim() === "") {
            return apiResponse.badRequest(res, "Note is required");
        }

        const order = await orderService.addAdminNote(orderId, note, adminId);

        return apiResponse.success(res, "Note added successfully", order);
    } catch (error) {
        logger.error(`Error adding admin note: ${error.message}`);

        if (error.message === "Order not found") {
            return apiResponse.notFound(res, "Order not found");
        }

        return apiResponse.serverError(res, "Failed to add note");
    }
};

/**
 * Get orders pending refund
 * GET /api/orders/refund-pending
 */
const getRefundPendingOrders = async (req, res) => {
    try {
        const orders = await orderService.getRefundPendingOrders();

        return apiResponse.success(
            res,
            "Refund pending orders retrieved successfully",
            orders,
        );
    } catch (error) {
        logger.error(`Error fetching refund pending orders: ${error.message}`);
        return apiResponse.serverError(
            res,
            "Failed to fetch refund pending orders",
        );
    }
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
    // View
    getAllOrders,
    getOrderStats,
    getOrderById,

    // Update
    updateOrderStatus,
    addShippingDetails,
    markAsDelivered,

    // Cancel & Notes
    cancelOrder,
    addAdminNote,
    getRefundPendingOrders,
};
