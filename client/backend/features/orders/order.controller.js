import * as orderService from "./order.service.js";
import apiResponse from "../../shared/utils/response.util.js";
import logger from "../../shared/utils/logger.util.js";

// ============================================================================
// GET ORDERS
// ============================================================================

/**
 * Get customer's orders with pagination
 * GET /api/orders
 */
const getMyOrders = async (req, res) => {
    try {
        const customerId = req.user.userId;
        const { page, limit, status, startDate, endDate } = req.query;

        const options = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            status,
            startDate,
            endDate,
        };

        const result = await orderService.getCustomerOrders(
            customerId,
            options,
        );

        return apiResponse.successWithPagination(
            res,
            "Orders retrieved successfully",
            result.orders,
            result.pagination,
        );
    } catch (error) {
        logger.error(`Error fetching customer orders: ${error.message}`);
        return apiResponse.serverError(res, "Failed to fetch orders");
    }
};

/**
 * Get single order details
 * GET /api/orders/:orderId
 */
const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const customerId = req.user.userId;

        const order = await orderService.getOrderById(orderId);

        // Check ownership
        if (order.customer._id.toString() !== customerId) {
            logger.warn(
                `Unauthorized order access attempt: User ${customerId} tried to access order ${orderId}`,
            );
            return apiResponse.forbidden(
                res,
                "You don't have access to this order",
            );
        }

        return apiResponse.success(
            res,
            "Order details retrieved successfully",
            order,
        );
    } catch (error) {
        logger.error(`Error fetching order details: ${error.message}`);

        if (error.message === "Order not found") {
            return apiResponse.notFound(res, "Order not found");
        }

        return apiResponse.serverError(res, "Failed to fetch order details");
    }
};

/**
 * Get order by order number
 * GET /api/orders/number/:orderNumber
 */
const getOrderByNumber = async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const customerId = req.user.userId;

        const order = await orderService.getOrderByNumber(orderNumber);

        // Check ownership
        if (order.customer._id.toString() !== customerId) {
            logger.warn(
                `Unauthorized order access attempt: User ${customerId} tried to access order ${orderNumber}`,
            );
            return apiResponse.forbidden(
                res,
                "You don't have access to this order",
            );
        }

        return apiResponse.success(res, "Order retrieved successfully", order);
    } catch (error) {
        logger.error(`Error fetching order by number: ${error.message}`);

        if (error.message === "Order not found") {
            return apiResponse.notFound(res, "Order not found");
        }

        return apiResponse.serverError(res, "Failed to fetch order");
    }
};

/**
 * Get customer order statistics
 * GET /api/orders/stats
 */
const getMyStats = async (req, res) => {
    try {
        const customerId = req.user.userId;

        const stats = await orderService.getCustomerStats(customerId);

        return apiResponse.success(
            res,
            "Order statistics retrieved successfully",
            stats,
        );
    } catch (error) {
        logger.error(`Error fetching customer stats: ${error.message}`);
        return apiResponse.serverError(res, "Failed to fetch statistics");
    }
};

// ============================================================================
// CANCEL ORDER
// ============================================================================

/**
 * Cancel an order
 * POST /api/orders/:orderId/cancel
 */
const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const customerId = req.user.userId;
        const { reason } = req.body;

        if (!reason || reason.trim() === "") {
            return apiResponse.badRequest(
                res,
                "Cancellation reason is required",
            );
        }

        // Get order to check ownership
        const order = await orderService.getOrderById(orderId);

        if (order.customer._id.toString() !== customerId) {
            logger.warn(
                `Unauthorized cancel attempt: User ${customerId} tried to cancel order ${orderId}`,
            );
            return apiResponse.forbidden(
                res,
                "You don't have permission to cancel this order",
            );
        }

        // Cancel order
        const result = await orderService.cancelOrder(orderId, reason);

        logger.info(
            `Order ${order.orderNumber} cancelled by customer ${customerId}`,
        );

        return apiResponse.success(res, "Order cancelled successfully", {
            orderId: result.order._id,
            orderNumber: result.order.orderNumber,
            status: result.order.orderStatus,
            refundRequired: result.refundRequired,
            refundAmount: result.refundRequired
                ? result.order.pricing.total
                : 0,
        });
    } catch (error) {
        logger.error(`Error cancelling order: ${error.message}`);

        if (error.message === "Order not found") {
            return apiResponse.notFound(res, "Order not found");
        }

        if (error.message.includes("Cannot cancel order")) {
            return apiResponse.badRequest(res, error.message);
        }

        return apiResponse.serverError(res, "Failed to cancel order");
    }
};

// ============================================================================
// TRACKING
// ============================================================================

/**
 * Get order tracking information
 * GET /api/orders/:orderId/track
 */
const trackOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const customerId = req.user.userId;

        const order = await orderService.getOrderById(orderId);

        // Check ownership
        if (order.customer._id.toString() !== customerId) {
            logger.warn(
                `Unauthorized tracking access: User ${customerId} tried to track order ${orderId}`,
            );
            return apiResponse.forbidden(
                res,
                "You don't have access to this order",
            );
        }

        const trackingData = {
            orderNumber: order.orderNumber,
            currentStatus: order.orderStatus,
            statusHistory: order.statusHistory,
            tracking: order.tracking,
        };

        return apiResponse.success(
            res,
            "Tracking information retrieved successfully",
            trackingData,
        );
    } catch (error) {
        logger.error(`Error fetching tracking info: ${error.message}`);

        if (error.message === "Order not found") {
            return apiResponse.notFound(res, "Order not found");
        }

        return apiResponse.serverError(
            res,
            "Failed to fetch tracking information",
        );
    }
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
    getMyOrders,
    getOrderDetails,
    getOrderByNumber,
    getMyStats,
    cancelOrder,
    trackOrder,
};
