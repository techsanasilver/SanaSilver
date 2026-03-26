import mongoose from "mongoose";

// ============================================================================
// COUNTER SCHEMA (atomic order number generation)
// ============================================================================

const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

// ============================================================================
// SUB-SCHEMAS
// ============================================================================

/**
 * Order Item Schema
 * Represents a single product variant in an order with pricing snapshot
 */
const orderItemSchema = new mongoose.Schema(
    {
        // Product references
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        variant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductVariant",
            required: true,
        },

        // Snapshot data (freeze at order time - never changes)
        productName: {
            type: String,
            required: true,
        },
        variantName: {
            type: String,
        },
        sku: {
            type: String,
            required: true,
        },
        image: {
            type: String,
        },

        // Quantity
        quantity: {
            type: Number,
            required: true,
            min: [1, "Quantity must be at least 1"],
        },

        // Weight (for jewelry)
        weight: {
            type: Number,
            min: 0,
        },

        // Price breakdown (snapshot - frozen at order creation)
        metalValue: {
            type: Number,
            min: 0,
            required: true,
        },
        makingCharges: {
            type: Number,
            min: 0,
            required: true,
        },
        gemstoneCharges: {
            type: Number,
            default: 0,
            min: 0,
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },

        // Discount (if coupon applied)
        discount: {
            type: Number,
            default: 0,
            min: 0,
        },
        discountedSubtotal: {
            type: Number,
            min: 0,
        },

        // Tax
        gstRate: {
            type: Number,
            min: 0,
            required: true,
        },
        gstAmount: {
            type: Number,
            min: 0,
            required: true,
        },

        // Final item total
        total: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: true },
);

/**
 * Address Schema
 * Snapshot of delivery/billing address at order time
 */
const addressSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        line1: {
            type: String,
            required: true,
        },
        line2: {
            type: String,
        },
        city: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        pincode: {
            type: String,
            required: true,
        },
        country: {
            type: String,
            default: "India",
        },
    },
    { _id: false },
);

/**
 * Status History Schema
 * Timeline of order status changes
 */
const statusHistorySchema = new mongoose.Schema(
    {
        status: {
            type: String,
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
        note: {
            type: String,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
        },
    },
    { _id: true },
);

// ============================================================================
// MAIN ORDER SCHEMA
// ============================================================================

const orderSchema = new mongoose.Schema(
    {
        // Auto-generated order number (e.g., ORD-20260209-0001)
        orderNumber: {
            type: String,
            required: true,
            unique: true,
        },

        // Customer reference
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Order items
        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: (arr) => arr.length > 0,
                message: "Order must have at least one item",
            },
        },

        // Addresses (snapshot)
        shippingAddress: {
            type: addressSchema,
            required: true,
        },
        billingAddress: {
            type: addressSchema,
            required: true,
        },

        // Pricing summary
        pricing: {
            itemsSubtotal: {
                type: Number,
                required: true,
                min: 0,
            },
            discount: {
                type: Number,
                default: 0,
                min: 0,
            },
            discountedSubtotal: {
                type: Number,
                min: 0,
            },
            shippingCharges: {
                type: Number,
                default: 0,
                min: 0,
            },
            taxableAmount: {
                type: Number,
                required: true,
                min: 0,
            },
            gst: {
                type: Number,
                required: true,
                min: 0,
            },
            total: {
                type: Number,
                required: true,
                min: 0,
            },
        },

        // Tax split (for invoice - CGST+SGST for intrastate, IGST for interstate)
        taxSplit: {
            cgst: { type: Number, min: 0 },
            sgst: { type: Number, min: 0 },
            igst: { type: Number, min: 0 },
        },

        // Applied coupon (snapshot at order creation)
        appliedCoupon: {
            code: {
                type: String,
                uppercase: true,
            },
            description: {
                type: String,
            },
            discountType: {
                type: String,
                enum: ["percentage", "flat", "free_shipping"],
            },
            discountValue: {
                type: Number,
                min: 0,
            },
            discountAmount: {
                type: Number,
                min: 0,
            },
        },

        // Payment details
        payment: {
            method: {
                type: String,
                enum: ["razorpay", "cod", "wallet"],
                required: true,
            },
            status: {
                type: String,
                enum: ["pending", "paid", "failed", "refunded"],
                default: "pending",
            },
            razorpayOrderId: { type: String },
            razorpayPaymentId: { type: String },
            razorpaySignature: { type: String },
            paidAt: { type: Date },
        },

        // Order status
        orderStatus: {
            type: String,
            enum: [
                "pending",
                "confirmed",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
            ],
            default: "pending",
        },

        // Status history timeline
        statusHistory: {
            type: [statusHistorySchema],
            default: [],
        },

        // Shipping/Tracking
        tracking: {
            courier: { type: String },
            trackingNumber: { type: String },
            shippedAt: { type: Date },
            estimatedDelivery: { type: Date },
            deliveredAt: { type: Date },
        },

        // Coupon info
        couponCode: { type: String },

        // Notes
        notes: { type: String }, // Admin notes
        customerNote: { type: String }, // Customer's special instructions
    },
    {
        timestamps: true,
    },
);

// ============================================================================
// INDEXES
// ============================================================================

// orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ "payment.status": 1 });
orderSchema.index({ createdAt: -1 });

// ============================================================================
// PRE-VALIDATE HOOKS
// ============================================================================

/**
 * Auto-generate order number BEFORE validation
 * Must be pre('validate'), not pre('save') — Mongoose runs validators before
 * pre-save hooks, so orderNumber would fail the required check otherwise.
 * Format: ORD-YYYYMMDD-0001
 */
orderSchema.pre("validate", async function () {
    if (!this.orderNumber) {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");

        // Atomically increment a per-day counter — race-condition safe
        const counter = await Counter.findOneAndUpdate(
            { _id: `orders-${dateStr}` },
            { $inc: { seq: 1 } },
            { new: true, upsert: true },
        );

        this.orderNumber = `ORD-${dateStr}-${String(counter.seq).padStart(4, "0")}`;
    }
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Check if order can be cancelled
 */
orderSchema.methods.canBeCancelled = function () {
    const cancellableStatuses = ["pending", "confirmed"];
    return cancellableStatuses.includes(this.orderStatus);
};

/**
 * Check if order can be returned
 */
orderSchema.methods.canBeReturned = function () {
    if (this.orderStatus !== "delivered") return false;

    // Check if within return window (7 days)
    const deliveryDate = this.tracking?.deliveredAt;
    if (!deliveryDate) return false;

    const daysSinceDelivery = Math.floor(
        (Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    return daysSinceDelivery <= 7;
};

/**
 * Get current status with timestamp
 */
orderSchema.methods.getCurrentStatus = function () {
    if (this.statusHistory.length === 0) {
        return {
            status: this.orderStatus,
            timestamp: this.createdAt,
        };
    }

    return this.statusHistory[this.statusHistory.length - 1];
};

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Get orders by customer with pagination
 */
orderSchema.statics.getCustomerOrders = async function (
    customerId,
    options = {},
) {
    const {
        page = 1,
        limit = 10,
        status = null,
        startDate = null,
        endDate = null,
    } = options;

    const query = { customer: customerId };

    if (status) {
        query.orderStatus = status;
    }

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
        this.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        this.countDocuments(query),
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
};

/**
 * Get order stats for customer
 */
orderSchema.statics.getCustomerStats = async function (customerId) {
    const stats = await this.aggregate([
        { $match: { customer: new mongoose.Types.ObjectId(customerId) } },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalSpent: { $sum: "$pricing.total" },
                completedOrders: {
                    $sum: {
                        $cond: [{ $eq: ["$orderStatus", "delivered"] }, 1, 0],
                    },
                },
                cancelledOrders: {
                    $sum: {
                        $cond: [{ $eq: ["$orderStatus", "cancelled"] }, 1, 0],
                    },
                },
            },
        },
    ]);

    return (
        stats[0] || {
            totalOrders: 0,
            totalSpent: 0,
            completedOrders: 0,
            cancelledOrders: 0,
        }
    );
};

// ============================================================================
// EXPORT MODEL
// ============================================================================

const Order = mongoose.model("Order", orderSchema);

export default Order;
