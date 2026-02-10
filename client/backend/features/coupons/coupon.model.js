import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
    {
        // Coupon Code
        code: {
            type: String,
            required: [true, "Coupon code is required"],
            unique: true,
            uppercase: true,
            trim: true,
        },

        // Description
        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
        },

        // Discount Configuration
        discountType: {
            type: String,
            enum: ["percentage", "flat", "free_shipping"],
            required: [true, "Discount type is required"],
        },
        discountValue: {
            type: Number,
            required: [true, "Discount value is required"],
            min: [0, "Discount value cannot be negative"],
        },
        maxDiscount: {
            type: Number,
            min: [0, "Maximum discount cannot be negative"],
        },
        minOrderValue: {
            type: Number,
            default: 0,
            min: [0, "Minimum order value cannot be negative"],
        },

        // Usage Limits
        usageLimit: {
            type: Number,
            min: [0, "Usage limit cannot be negative"],
        },
        usageCount: {
            type: Number,
            default: 0,
            min: [0, "Usage count cannot be negative"],
        },
        perUserLimit: {
            type: Number,
            default: 1,
            min: [1, "Per user limit must be at least 1"],
        },

        // Validity Period
        validFrom: {
            type: Date,
            required: [true, "Valid from date is required"],
        },
        validTo: {
            type: Date,
            required: [true, "Valid to date is required"],
        },

        // Status
        isActive: {
            type: Boolean,
            default: true,
        },

        // Applicability Filters
        applicableCategories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Category",
            },
        ],
        applicableProducts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },
        ],
        excludedProducts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },
        ],
        applicableCollections: {
            type: [String],
            default: [],
        },

        // User-Specific
        applicableUsers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        firstTimeUserOnly: {
            type: Boolean,
            default: false,
        },

        // Usage Tracking
        usedBy: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                usedCount: {
                    type: Number,
                    default: 1,
                },
                lastUsedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        // Metadata
        tags: {
            type: [String],
            default: [],
        },
        internalNotes: {
            type: String,
        },
    },
    {
        timestamps: true,
    },
);

// ============================================================================
// INDEXES
// ============================================================================

// couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1 });
couponSchema.index({ validFrom: 1, validTo: 1 });
couponSchema.index({ "usedBy.user": 1 });

// ============================================================================
// VALIDATION
// ============================================================================

// Validate that validTo is after validFrom
couponSchema.pre("save", function (next) {
    if (this.validTo <= this.validFrom) {
        next(new Error("Valid to date must be after valid from date"));
    }
    next();
});

// ============================================================================
// VIRTUAL PROPERTIES
// ============================================================================

// Check if coupon is currently valid
couponSchema.virtual("isCurrentlyValid").get(function () {
    const now = new Date();
    return (
        this.isActive &&
        this.validFrom <= now &&
        this.validTo >= now &&
        (!this.usageLimit || this.usageCount < this.usageLimit)
    );
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Check if user has exceeded their usage limit for this coupon
 */
couponSchema.methods.hasUserExceededLimit = function (userId) {
    const userUsage = this.usedBy.find(
        (usage) => usage.user.toString() === userId.toString(),
    );
    return userUsage && userUsage.usedCount >= this.perUserLimit;
};

/**
 * Get user's usage count for this coupon
 */
couponSchema.methods.getUserUsageCount = function (userId) {
    const userUsage = this.usedBy.find(
        (usage) => usage.user.toString() === userId.toString(),
    );
    return userUsage ? userUsage.usedCount : 0;
};

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Find active coupons available for a user
 */
couponSchema.statics.findAvailableForUser = async function (userId) {
    const now = new Date();

    const coupons = await this.find({
        isActive: true,
        validFrom: { $lte: now },
        validTo: { $gte: now },
        $or: [
            { usageLimit: { $exists: false } },
            { $expr: { $lt: ["$usageCount", "$usageLimit"] } },
        ],
    }).lean();

    // Filter out coupons where user has exceeded limit
    return coupons.filter((coupon) => {
        // Check user-specific restrictions
        if (
            coupon.applicableUsers &&
            coupon.applicableUsers.length > 0 &&
            !coupon.applicableUsers.some(
                (id) => id.toString() === userId.toString(),
            )
        ) {
            return false;
        }

        // Check user usage limit
        const userUsage = coupon.usedBy?.find(
            (usage) => usage.user.toString() === userId.toString(),
        );
        if (userUsage && userUsage.usedCount >= coupon.perUserLimit) {
            return false;
        }

        return true;
    });
};

// ============================================================================
// EXPORT MODEL
// ============================================================================

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
