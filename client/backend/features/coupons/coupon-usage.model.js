import mongoose from "mongoose";

const couponUsageSchema = new mongoose.Schema(
    {
        // Coupon Reference
        coupon: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Coupon",
            required: [true, "Coupon reference is required"],
            index: true,
        },

        // User Reference
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User reference is required"],
            index: true,
        },

        // Order Reference (for tracking which order used this coupon)
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: [true, "Order reference is required"],
        },

        // Discount Applied
        discountApplied: {
            type: Number,
            required: [true, "Discount amount is required"],
            min: [0, "Discount cannot be negative"],
        },

        // Order Value at time of usage
        orderValue: {
            type: Number,
            required: [true, "Order value is required"],
            min: [0, "Order value cannot be negative"],
        },

        // Usage Timestamp (from timestamps, but also explicit for clarity)
        usedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: true,
    },
);

// ============================================================================
// INDEXES
// ============================================================================

// Compound indexes for efficient queries
couponUsageSchema.index({ coupon: 1, user: 1 }); // User's usage of specific coupon
couponUsageSchema.index({ coupon: 1, usedAt: -1 }); // Coupon usage timeline
couponUsageSchema.index({ user: 1, usedAt: -1 }); // User's coupon history

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Get user's usage count for a specific coupon
 */
couponUsageSchema.statics.getUserUsageCount = async function (
    couponId,
    userId,
) {
    return await this.countDocuments({
        coupon: couponId,
        user: userId,
    });
};

/**
 * Check if user has exceeded limit for a coupon
 */
couponUsageSchema.statics.hasUserExceededLimit = async function (
    couponId,
    userId,
    perUserLimit,
) {
    const usageCount = await this.getUserUsageCount(couponId, userId);
    return usageCount >= perUserLimit;
};

/**
 * Get usage statistics for a coupon
 */
couponUsageSchema.statics.getCouponStats = async function (couponId) {
    const stats = await this.aggregate([
        { $match: { coupon: mongoose.Types.ObjectId(couponId) } },
        {
            $group: {
                _id: null,
                totalUsage: { $sum: 1 },
                uniqueUsers: { $addToSet: "$user" },
                totalDiscount: { $sum: "$discountApplied" },
                totalRevenue: { $sum: "$orderValue" },
            },
        },
        {
            $project: {
                _id: 0,
                totalUsage: 1,
                uniqueUsers: { $size: "$uniqueUsers" },
                totalDiscount: 1,
                totalRevenue: 1,
                averageDiscount: {
                    $divide: ["$totalDiscount", "$totalUsage"],
                },
            },
        },
    ]);

    return stats.length > 0 ? stats[0] : null;
};

/**
 * Get recent usage history for a coupon
 */
couponUsageSchema.statics.getRecentUsage = async function (
    couponId,
    limit = 20,
) {
    return await this.find({ coupon: couponId })
        .sort({ usedAt: -1 })
        .limit(limit)
        .populate("user", "name email")
        .populate("order", "orderNumber")
        .lean();
};

/**
 * Get user's coupon usage history
 */
couponUsageSchema.statics.getUserHistory = async function (userId, limit = 20) {
    return await this.find({ user: userId })
        .sort({ usedAt: -1 })
        .limit(limit)
        .populate("coupon", "code description discountType")
        .populate("order", "orderNumber")
        .lean();
};

/**
 * Record a new coupon usage
 */
couponUsageSchema.statics.recordUsage = async function (usageData) {
    const { couponId, userId, orderId, discountApplied, orderValue } =
        usageData;

    return await this.create({
        coupon: couponId,
        user: userId,
        order: orderId,
        discountApplied,
        orderValue,
        usedAt: new Date(),
    });
};

// ============================================================================
// MODEL EXPORT
// ============================================================================

const CouponUsage = mongoose.model("CouponUsage", couponUsageSchema);

export default CouponUsage;
