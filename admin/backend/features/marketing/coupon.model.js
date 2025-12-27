import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, "Coupon code is required"],
            unique: true,
            uppercase: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        discountType: {
            type: String,
            enum: ["percentage", "fixed"],
            required: [true, "Discount type is required"],
        },
        discountValue: {
            type: Number,
            required: [true, "Discount value is required"],
            min: [0, "Discount value cannot be negative"],
        },
        minOrderValue: {
            type: Number,
            default: 0,
            min: [0, "Minimum order value cannot be negative"],
        },
        maxDiscount: {
            type: Number,
            min: [0, "Maximum discount cannot be negative"],
        },
        usageLimit: {
            type: Number,
            min: [1, "Usage limit must be at least 1"],
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
        validFrom: {
            type: Date,
            required: [true, "Valid from date is required"],
        },
        validTo: {
            type: Date,
            required: [true, "Valid to date is required"],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        applicableCategories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Category",
            },
        ],
        excludedProducts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1 });
couponSchema.index({ validFrom: 1, validTo: 1 });

// Validate that validTo is after validFrom
couponSchema.pre("save", function (next) {
    if (this.validTo <= this.validFrom) {
        next(new Error("Valid to date must be after valid from date"));
    }
    next();
});

// Virtual to check if coupon is currently valid
couponSchema.virtual("isCurrentlyValid").get(function () {
    const now = new Date();
    return (
        this.isActive &&
        this.validFrom <= now &&
        this.validTo >= now &&
        (!this.usageLimit || this.usageCount < this.usageLimit)
    );
});

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
