import Order from "./order.model.js";
import ProductVariant from "../products/product-variant.model.js";
import logger from "../../shared/utils/logger.util.js";
import mongoose from "mongoose";

// ============================================================================
// CREATE ORDER
// ============================================================================

/**
 * Create a new order
 * @param {Object} orderData - Order data
 * @param {Object} session - MongoDB session for transaction
 * @returns {Promise<Object>} Created order
 */
const createOrder = async (orderData, session = null) => {
    try {
        const order = new Order(orderData);
        await order.save({ session });

        logger.info(`Order created: ${order.orderNumber}`);
        return order;
    } catch (error) {
        logger.error(`Error creating order: ${error.message}`);
        throw error;
    }
};

// ============================================================================
// GET ORDERS
// ============================================================================

/**
 * Get order by ID with populated fields
 * @param {String} orderId - Order ID
 * @returns {Promise<Object>} Order document
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
 * Get order by order number
 * @param {String} orderNumber - Order number (e.g., ORD-20260209-0001)
 * @returns {Promise<Object>} Order document
 */
const getOrderByNumber = async (orderNumber) => {
    try {
        const order = await Order.findOne({ orderNumber })
            .populate("customer", "firstName lastName email phone")
            .populate("items.product", "name images category")
            .populate("items.variant", "sku size color images stockQuantity")
            .lean();

        if (!order) {
            throw new Error("Order not found");
        }

        return order;
    } catch (error) {
        logger.error(`Error fetching order ${orderNumber}: ${error.message}`);
        throw error;
    }
};

/**
 * Get orders by customer with pagination and filters
 * @param {String} customerId - Customer ID
 * @param {Object} options - Query options (page, limit, status, dates)
 * @returns {Promise<Object>} Orders with pagination
 */
const getCustomerOrders = async (customerId, options = {}) => {
    try {
        const result = await Order.getCustomerOrders(customerId, options);
        return result;
    } catch (error) {
        logger.error(`Error fetching customer orders: ${error.message}`);
        throw error;
    }
};

/**
 * Get all orders with pagination (admin)
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Orders with pagination
 */
const getAllOrders = async (options = {}) => {
    try {
        const {
            page = 1,
            limit = 20,
            status = null,
            paymentStatus = null,
            startDate = null,
            endDate = null,
            searchTerm = null,
        } = options;

        const query = {};

        if (status) query.orderStatus = status;
        if (paymentStatus) query["payment.status"] = paymentStatus;

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

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
 * Get customer order statistics
 * @param {String} customerId - Customer ID
 * @returns {Promise<Object>} Order stats
 */
const getCustomerStats = async (customerId) => {
    try {
        const stats = await Order.getCustomerStats(customerId);
        return stats;
    } catch (error) {
        logger.error(`Error fetching customer stats: ${error.message}`);
        throw error;
    }
};

// ============================================================================
// UPDATE ORDER STATUS
// ============================================================================

/**
 * Update order status
 * @param {String} orderId - Order ID
 * @param {String} newStatus - New status
 * @param {Object} options - Additional options (note, updatedBy)
 * @returns {Promise<Object>} Updated order
 */
const updateOrderStatus = async (orderId, newStatus, options = {}) => {
    try {
        const order = await Order.findById(orderId);

        if (!order) {
            throw new Error("Order not found");
        }

        // Validate status transition
        const validStatuses = [
            "pending",
            "confirmed",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
        ];
        if (!validStatuses.includes(newStatus)) {
            throw new Error(`Invalid status: ${newStatus}`);
        }

        // Update status
        order.orderStatus = newStatus;

        // Add to status history with note
        if (options.note || options.updatedBy) {
            const historyEntry = {
                status: newStatus,
                timestamp: new Date(),
            };
            if (options.note) historyEntry.note = options.note;
            if (options.updatedBy) historyEntry.updatedBy = options.updatedBy;

            order.statusHistory.push(historyEntry);
        }

        await order.save();

        logger.info(
            `Order ${order.orderNumber} status updated to: ${newStatus}`,
        );
        return order;
    } catch (error) {
        logger.error(`Error updating order status: ${error.message}`);
        throw error;
    }
};

/**
 * Update payment status
 * @param {String} orderId - Order ID
 * @param {String} paymentStatus - Payment status
 * @param {Object} paymentDetails - Payment details (razorpayPaymentId, etc.)
 * @returns {Promise<Object>} Updated order
 */
const updatePaymentStatus = async (
    orderId,
    paymentStatus,
    paymentDetails = {},
) => {
    try {
        const order = await Order.findById(orderId);

        if (!order) {
            throw new Error("Order not found");
        }

        order.payment.status = paymentStatus;

        if (paymentDetails.razorpayPaymentId) {
            order.payment.razorpayPaymentId = paymentDetails.razorpayPaymentId;
        }
        if (paymentDetails.razorpaySignature) {
            order.payment.razorpaySignature = paymentDetails.razorpaySignature;
        }
        if (paymentStatus === "paid") {
            order.payment.paidAt = new Date();
            // Auto-confirm order on successful payment
            if (order.orderStatus === "pending") {
                order.orderStatus = "confirmed";
            }
        }

        await order.save();

        logger.info(
            `Order ${order.orderNumber} payment status updated to: ${paymentStatus}`,
        );
        return order;
    } catch (error) {
        logger.error(`Error updating payment status: ${error.message}`);
        throw error;
    }
};

// ============================================================================
// CANCEL ORDER
// ============================================================================

/**
 * Cancel an order and restore stock
 * @param {String} orderId - Order ID
 * @param {String} reason - Cancellation reason
 * @param {String} userId - User who cancelled (for admin cancellations)
 * @returns {Promise<Object>} Result object
 */
const cancelOrder = async (orderId, reason, userId = null) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await Order.findById(orderId).session(session);

        if (!order) {
            throw new Error("Order not found");
        }

        // Check if can be cancelled
        if (!order.canBeCancelled()) {
            throw new Error(
                `Cannot cancel order in '${order.orderStatus}' status`,
            );
        }

        // Update status to cancelled
        order.orderStatus = "cancelled";
        order.statusHistory.push({
            status: "cancelled",
            timestamp: new Date(),
            note: reason,
            updatedBy: userId,
        });

        await order.save({ session });

        // Restore stock for all items
        await restoreStock(order.items, session);

        // If payment was made, mark for refund
        if (order.payment.status === "paid") {
            order.payment.status = "refunded";
            await order.save({ session });
        }

        await session.commitTransaction();

        logger.info(`Order ${order.orderNumber} cancelled. Reason: ${reason}`);

        return {
            success: true,
            order,
            refundRequired: order.payment.status === "refunded",
        };
    } catch (error) {
        await session.abortTransaction();
        logger.error(`Error cancelling order: ${error.message}`);
        throw error;
    } finally {
        session.endSession();
    }
};

// ============================================================================
// STOCK MANAGEMENT
// ============================================================================

/**
 * Reduce stock for order items (atomic operation)
 * @param {Array} items - Order items
 * @param {Object} session - MongoDB session
 * @returns {Promise<void>}
 */
const reduceStock = async (items, session = null) => {
    try {
        for (const item of items) {
            const result = await ProductVariant.findOneAndUpdate(
                {
                    _id: item.variant,
                    stockQuantity: { $gte: item.quantity }, // Only if enough stock
                },
                {
                    $inc: { stockQuantity: -item.quantity }, // Atomic decrement
                },
                {
                    new: true,
                    session,
                },
            );

            if (!result) {
                throw new Error(`Insufficient stock for SKU: ${item.sku}`);
            }

            logger.info(
                `Stock reduced: ${item.sku} -${item.quantity} (new: ${result.stockQuantity})`,
            );
        }
    } catch (error) {
        logger.error(`Error reducing stock: ${error.message}`);
        throw error;
    }
};

/**
 * Restore stock for cancelled/failed orders
 * @param {Array} items - Order items
 * @param {Object} session - MongoDB session
 * @returns {Promise<void>}
 */
const restoreStock = async (items, session = null) => {
    try {
        for (const item of items) {
            await ProductVariant.findByIdAndUpdate(
                item.variant,
                {
                    $inc: { stockQuantity: item.quantity }, // Add back
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
 * Validate stock availability for items
 * @param {Array} items - Items to validate [{variant, quantity}]
 * @returns {Promise<Object>} Validation result
 */
const validateStock = async (items) => {
    try {
        const errors = [];

        for (const item of items) {
            const variant = await ProductVariant.findById(item.variant).lean();

            if (!variant) {
                errors.push({
                    variantId: item.variant,
                    issue: "Product variant not found",
                });
                continue;
            }

            if (variant.stockQuantity < item.quantity) {
                errors.push({
                    variantId: item.variant,
                    sku: variant.sku,
                    requested: item.quantity,
                    available: variant.stockQuantity,
                    issue: "Insufficient stock",
                });
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    } catch (error) {
        logger.error(`Error validating stock: ${error.message}`);
        throw error;
    }
};

// ============================================================================
// TRACKING & SHIPPING
// ============================================================================

/**
 * Add tracking information to order
 * @param {String} orderId - Order ID
 * @param {Object} trackingData - Tracking details
 * @returns {Promise<Object>} Updated order
 */
const addTrackingInfo = async (orderId, trackingData) => {
    try {
        const order = await Order.findById(orderId);

        if (!order) {
            throw new Error("Order not found");
        }

        // Update tracking info
        order.tracking = {
            courier: trackingData.courier,
            trackingNumber: trackingData.trackingNumber,
            shippedAt: trackingData.shippedAt || new Date(),
            estimatedDelivery: trackingData.estimatedDelivery,
        };

        // Update status to shipped
        if (order.orderStatus !== "shipped") {
            order.orderStatus = "shipped";
        }

        await order.save();

        logger.info(`Tracking info added for order: ${order.orderNumber}`);
        return order;
    } catch (error) {
        logger.error(`Error adding tracking info: ${error.message}`);
        throw error;
    }
};

/**
 * Mark order as delivered
 * @param {String} orderId - Order ID
 * @returns {Promise<Object>} Updated order
 */
const markAsDelivered = async (orderId) => {
    try {
        const order = await Order.findById(orderId);

        if (!order) {
            throw new Error("Order not found");
        }

        order.orderStatus = "delivered";
        order.tracking.deliveredAt = new Date();

        await order.save();

        logger.info(`Order ${order.orderNumber} marked as delivered`);
        return order;
    } catch (error) {
        logger.error(`Error marking order as delivered: ${error.message}`);
        throw error;
    }
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
    // Create
    createOrder,

    // Read
    getOrderById,
    getOrderByNumber,
    getCustomerOrders,
    getAllOrders,
    getCustomerStats,

    // Update
    updateOrderStatus,
    updatePaymentStatus,

    // Cancel
    cancelOrder,

    // Stock
    reduceStock,
    restoreStock,
    validateStock,

    // Tracking
    addTrackingInfo,
    markAsDelivered,
};
