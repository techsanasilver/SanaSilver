import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product is required"],
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Customer is required"],
        },
        // Snapshot — readable even if account is later modified
        customerName: {
            type: String,
            required: [true, "Customer name snapshot is required"],
            trim: true,
        },
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: [true, "Order reference is required"],
        },
        rating: {
            type: Number,
            required: [true, "Rating is required"],
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating cannot exceed 5"],
        },
        title: {
            type: String,
            trim: true,
            maxlength: [100, "Title cannot exceed 100 characters"],
        },
        body: {
            type: String,
            required: [true, "Review body is required"],
            trim: true,
            minlength: [10, "Review must be at least 10 characters"],
            maxlength: [1000, "Review cannot exceed 1000 characters"],
        },
        status: {
            type: String,
            enum: ["approved", "rejected"],
            default: "approved",
        },
        // Admin-facing rejection note (not shown to customers)
        adminNote: {
            type: String,
            trim: true,
        },
        moderatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
        },
        moderatedAt: {
            type: Date,
        },
        isVerifiedPurchase: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    },
);

// One review per product per customer
reviewSchema.index({ product: 1, customer: 1 }, { unique: true });
// Fetch approved reviews for a product page (most common query)
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
// Customer's review history
reviewSchema.index({ customer: 1, createdAt: -1 });
// Admin moderation queue
reviewSchema.index({ status: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
