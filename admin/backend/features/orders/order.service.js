import Order from "./order.model.js";
import logger from "../../shared/utils/logger.util.js";
import mongoose from "mongoose";

// ============================================================================
// GET ORDERS
// ============================================================================

/**
 * Get all orders with filters and pagination (Admin)
 */
const getAllOrders = async (filters = {}) => {
    try {
        const {
            page = 1,
            limit = 20,
            status = null,
            paymentStatus = null,
            startDate = null,
            endDate = null,
            searchTerm = null,
        } = filters;

        const query = {};

        // Filter by order status
        if (status) {
            query.orderStatus = status;
        }

        // Filter by payment status
        if (paymentStatus) {
            query["payment.status"] = paymentStatus;
        }

        // Filter by date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Search by order number, customer name, or phone
        if (searchTerm) {
            query.$or = [
                { orderNumber: { $regex: searchTerm, $options: "i" } },
                {
                    "shippingAddress.name": {
                        $regex: searchTerm,
                        $options: "i",
                    },
                },
                {
                    "shippingAddress.phone": {
                        $regex: searchTerm,
                        $options: "i",
                    },
                },
            ];
        }

        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find(query)
                .populate("customer", "firstName lastName email phone")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(query),
        ]);

        return {
            orders,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalOrders: total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1,
            },
        };
    } catch (error) {
        logger.error(`Error fetching all orders: ${error.message}`);
        throw error;
    }
};

/**
 * Get order by ID with full details (Admin)
 */
const getOrderById = async (orderId) => {
    try {
        const order = await Order.findById(orderId)
            .populate("customer", "firstName lastName email phone")
            .populate("items.product", "name images category")
            .populate("items.variant", "sku size color images stockQuantity")
            .lean();

        if (!order) {
            throw new Error("Order not found");
        }

        return order;
    } catch (error) {
        logger.error(`Error fetching order ${orderId}: ${error.message}`);
        throw error;
    }
};

/**
 * Get order statistics for admin dashboard
 */
const getOrderStats = async (period = "all") => {
    try {
        let dateFilter = {};

        // Calculate date range based on period
        const now = new Date();
        if (period === "today") {
            const startOfDay = new Date(now.setHours(0, 0, 0, 0));
            dateFilter = { createdAt: { $gte: startOfDay } };
        } else if (period === "week") {
            const startOfWeek = new Date(now.setDate(now.getDate() - 7));
            dateFilter = { createdAt: { $gte: startOfWeek } };
        } else if (period === "month") {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter = { createdAt: { $gte: startOfMonth } };
        }

        // Get order statistics
        const stats = await Order.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: "$pricing.total" },
                    avgOrderValue: { $avg: "$pricing.total" },
                    pendingCount: {
                        $sum: {
                            $cond: [{ $eq: ["$orderStatus", "pending"] }, 1, 0],
                        },
                    },
                    confirmedCount: {
                        $sum: {
                            $cond: [
                                { $eq: ["$orderStatus", "confirmed"] },
                                1,
                                0,
                            ],
                        },
                    },
                    processingCount: {
                        $sum: {
                            $cond: [
                                { $eq: ["$orderStatus", "processing"] },
                                1,
                                0,
                            ],
                        },
                    },
                    shippedCount: {
                        $sum: {
                            $cond: [{ $eq: ["$orderStatus", "shipped"] }, 1, 0],
                        },
                    },
                    deliveredCount: {
                        $sum: {
                            $cond: [
                                { $eq: ["$orderStatus", "delivered"] },
                                1,
                                0,
                            ],
                        },
                    },
                    cancelledCount: {
                        $sum: {
                            $cond: [
                                { $eq: ["$orderStatus", "cancelled"] },
                                1,
                                0,
                            ],
                        },
                    },
                    codOrders: {
                        $sum: {
                            $cond: [{ $eq: ["$payment.method", "cod"] }, 1, 0],
                        },
                    },
                    onlineOrders: {
                        $sum: {
                            $cond: [
                                { $eq: ["$payment.method", "razorpay"] },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]);

        const result = stats[0] || {
            totalOrders: 0,
            totalRevenue: 0,
            avgOrderValue: 0,
            pendingCount: 0,
            confirmedCount: 0,
            processingCount: 0,
            shippedCount: 0,
            deliveredCount: 0,
            cancelledCount: 0,
            codOrders: 0,
            onlineOrders: 0,
        };

        return {
            ...result,
            statusBreakdown: {
                pending: result.pendingCount,
                confirmed: result.confirmedCount,
                processing: result.processingCount,
                shipped: result.shippedCount,
                delivered: result.deliveredCount,
                cancelled: result.cancelledCount,
            },
            paymentMethodBreakdown: {
                cod: result.codOrders,
                online: result.onlineOrders,
            },
        };
    } catch (error) {
        logger.error(`Error fetching order statistics: ${error.message}`);
        throw error;
    }
};

// ============================================================================
// UPDATE ORDER STATUS
// ============================================================================

/**
 * Update order status with validation
 */
const updateOrderStatus = async (orderId, newStatus, adminId, note = "") => {
    try {
        const order = await Order.findById(orderId);

        if (!order) {
            throw new Error("Order not found");
        }

        // Validate status transition
        const validTransitions = {
            pending: ["confirmed", "cancelled"],
            confirmed: ["processing", "cancelled"],
            processing: ["shipped", "cancelled"],
            shipped: ["delivered"],
            delivered: [], // Terminal state
            cancelled: [], // Terminal state
        };

        const allowedStatuses = validTransitions[order.orderStatus] || [];

        if (!allowedStatuses.includes(newStatus)) {
            throw new Error(
                `Cannot transition from ${order.orderStatus} to ${newStatus}`,
            );
        }

        // Update status
        order.orderStatus = newStatus;
        order.statusHistory.push({
            status: newStatus,
            timestamp: new Date(),
            note: note || `Status updated by admin`,
            updatedBy: adminId,
        });

        await order.save();

        logger.info(
            `Order ${order.orderNumber} status updated to ${newStatus} by admin ${adminId}`,
        );

        return order;
    } catch (error) {
        logger.error(`Error updating order status: ${error.message}`);
        throw error;
    }
};

/**
 * Add shipping details to order
 */
const addShippingDetails = async (orderId, shippingDetails, adminId) => {
    try {
        const { courier, trackingNumber, estimatedDelivery } = shippingDetails;

        const order = await Order.findById(orderId);

        if (!order) {
            throw new Error("Order not found");
        }

        // Cannot add shipping to a terminal or unprepared order
        if (order.orderStatus === "delivered") {
            throw new Error("Order has already been delivered");
        }
        if (order.orderStatus === "cancelled") {
            throw new Error("Cannot add shipping to a cancelled order");
        }

        // Update tracking information
        order.tracking = {
            courier,
            trackingNumber,
            shippedAt: new Date(),
            estimatedDelivery: estimatedDelivery
                ? new Date(estimatedDelivery)
                : null,
        };

        // Auto-update status to shipped
        if (order.orderStatus !== "shipped") {
            order.orderStatus = "shipped";
            order.statusHistory.push({
                status: "shipped",
                timestamp: new Date(),
                note: `Shipped via ${courier} - Tracking: ${trackingNumber}`,
                updatedBy: adminId,
            });
        }

        await order.save();

        logger.info(
            `Shipping details added for order ${order.orderNumber} by admin ${adminId}`,
        );

        return order;
    } catch (error) {
        logger.error(`Error adding shipping details: ${error.message}`);
        throw error;
    }
};

/**
 * Mark order as delivered
 */
const markAsDelivered = async (orderId, adminId) => {
    try {
        const order = await Order.findById(orderId);

        if (!order) {
            throw new Error("Order not found");
        }

        if (order.orderStatus !== "shipped") {
            throw new Error("Only shipped orders can be marked as delivered");
        }

        order.orderStatus = "delivered";
        order.tracking.deliveredAt = new Date();
        order.statusHistory.push({
            status: "delivered",
            timestamp: new Date(),
            note: "Order delivered",
            updatedBy: adminId,
        });

        await order.save();

        logger.info(
            `Order ${order.orderNumber} marked as delivered by admin ${adminId}`,
        );

        return order;
    } catch (error) {
        logger.error(`Error marking order as delivered: ${error.message}`);
        throw error;
    }
};

// ============================================================================
// CANCELLATION & REFUNDS
// ============================================================================

/**
 * Cancel order by admin (can override customer restrictions)
 */
const cancelOrderByAdmin = async (orderId, reason, adminId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await Order.findById(orderId).session(session);

        if (!order) {
            throw new Error("Order not found");
        }

        // Admin can cancel from any status except delivered
        if (order.orderStatus === "delivered") {
            throw new Error("Cannot cancel delivered orders");
        }

        if (order.orderStatus === "cancelled") {
            throw new Error("Order is already cancelled");
        }

        // Update status to cancelled
        order.orderStatus = "cancelled";
        order.statusHistory.push({
            status: "cancelled",
            timestamp: new Date(),
            note: `Cancelled by admin: ${reason}`,
            updatedBy: adminId,
        });

        // If payment was made, mark for refund (consolidate into single save)
        const refundRequired = order.payment.status === "paid";
        if (refundRequired) {
            order.payment.status = "refunded";
            order.notes = (order.notes || "") + `\nRefund required: ${reason}`;
        }

        await order.save({ session });

        // Restore stock
        await restoreStock(order.items, session);

        await session.commitTransaction();

        logger.info(
            `Order ${order.orderNumber} cancelled by admin ${adminId}. Reason: ${reason}`,
        );

        return {
            success: true,
            order,
            refundRequired,
        };
    } catch (error) {
        await session.abortTransaction();
        logger.error(`Error cancelling order: ${error.message}`);
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Restore stock for cancelled orders
 */
const restoreStock = async (items, session = null) => {
    try {
        const ProductVariant = mongoose.model("ProductVariant");

        for (const item of items) {
            await ProductVariant.findByIdAndUpdate(
                item.variant,
                {
                    $inc: { stockQuantity: item.quantity },
                },
                { session },
            );

            logger.info(`Stock restored: ${item.sku} +${item.quantity}`);
        }
    } catch (error) {
        logger.error(`Error restoring stock: ${error.message}`);
        throw error;
    }
};

/**
 * Add internal admin note to order
 */
const addAdminNote = async (orderId, note, adminId) => {
    try {
        const order = await Order.findById(orderId);

        if (!order) {
            throw new Error("Order not found");
        }

        const timestamp = new Date().toISOString();
        const adminNote = `[${timestamp}] Admin ${adminId}: ${note}`;

        order.notes = order.notes ? `${order.notes}\n${adminNote}` : adminNote;

        await order.save();

        logger.info(`Admin note added to order ${order.orderNumber}`);

        return order;
    } catch (error) {
        logger.error(`Error adding admin note: ${error.message}`);
        throw error;
    }
};

/**
 * Get orders needing refund processing
 */
const getRefundPendingOrders = async () => {
    try {
        const orders = await Order.find({
            "payment.status": "refunded",
            orderStatus: "cancelled",
        })
            .populate("customer", "firstName lastName email phone")
            .sort({ createdAt: -1 })
            .lean();

        return orders;
    } catch (error) {
        logger.error(`Error fetching refund pending orders: ${error.message}`);
        throw error;
    }
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
    // View
    getAllOrders,
    getOrderById,
    getOrderStats,

    // Update
    updateOrderStatus,
    addShippingDetails,
    markAsDelivered,

    // Cancel & Refund
    cancelOrderByAdmin,
    addAdminNote,
    getRefundPendingOrders,
};
