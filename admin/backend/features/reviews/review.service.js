import mongoose from "mongoose";
import Review from "./review.model.js";
import Product from "../products/product.model.js";
import logger from "../../shared/utils/logger.util.js";

// ─── Private helper ───────────────────────────────────────────────────────────

/**
 * Recompute product.ratings.average and product.ratings.count
 * from scratch — safe against race conditions on concurrent moderation actions.
 */
const recalculateProductRatings = async (productId) => {
    const result = await Review.aggregate([
        {
            $match: {
                product: new mongoose.Types.ObjectId(productId),
                status: "approved",
            },
        },
        {
            $group: {
                _id: null,
                avg: { $avg: "$rating" },
                count: { $sum: 1 },
            },
        },
    ]);

    const avg = result[0]?.avg ?? 0;
    const count = result[0]?.count ?? 0;

    await Product.findByIdAndUpdate(productId, {
        "ratings.average": Math.round(avg * 10) / 10,
        "ratings.count": count,
    });
};

// ─── Services ─────────────────────────────────────────────────────────────────

/**
 * List all reviews with filtering, sorting, and pagination.
 * Used by the admin moderation panel.
 */
export const listReviews = async (
    filters = {},
    { page = 1, limit = 20, sortBy = "newest" } = {},
) => {
    const skip = (page - 1) * limit;

    const query = {};
    if (filters.status && filters.status !== "all") {
        query.status = filters.status;
    }
    if (filters.productId) query.product = filters.productId;
    if (filters.customerId) query.customer = filters.customerId;
    if (filters.rating) query.rating = Number(filters.rating);
    if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
    }

    const sortMap = {
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        highest: { rating: -1, createdAt: -1 },
        lowest: { rating: 1, createdAt: -1 },
    };
    const sort = sortMap[sortBy] ?? sortMap.newest;

    const [reviews, total, statusCounts] = await Promise.all([
        Review.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate("product", "name slug images")
            .populate("customer", "firstName lastName email phone")
            .lean(),
        Review.countDocuments(query),
        Review.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

    const summary = { approved: 0, rejected: 0 };
    statusCounts.forEach((s) => {
        if (s._id in summary) summary[s._id] = s.count;
    });
    summary.total = summary.approved + summary.rejected;

    return {
        data: reviews,
        summary,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get a single review by ID with full population.
 */
export const getReviewById = async (reviewId) => {
    const review = await Review.findById(reviewId)
        .populate("product", "name slug images")
        .populate("customer", "firstName lastName email phone")
        .populate("order", "orderNumber createdAt pricing.total")
        .populate("moderatedBy", "name email")
        .lean();

    if (!review) {
        throw Object.assign(new Error("Review not found"), { statusCode: 404 });
    }

    return review;
};

/**
 * Approve a review. Triggers rating recalculation.
 * No-op if the review is already approved.
 */
export const approveReview = async (reviewId, adminId) => {
    const review = await Review.findById(reviewId);
    if (!review) {
        throw Object.assign(new Error("Review not found"), { statusCode: 404 });
    }

    const wasRejected = review.status === "rejected";

    review.status = "approved";
    review.adminNote = undefined;
    review.moderatedBy = adminId;
    review.moderatedAt = new Date();
    await review.save();

    // Only recalculate if status actually changed
    if (wasRejected) {
        await recalculateProductRatings(review.product);
    }

    logger.info("Review approved", {
        reviewId,
        adminId,
        productId: review.product,
    });
    return review;
};

/**
 * Reject a review. Triggers rating recalculation if it was previously approved.
 */
export const rejectReview = async (reviewId, adminId, adminNote) => {
    const review = await Review.findById(reviewId);
    if (!review) {
        throw Object.assign(new Error("Review not found"), { statusCode: 404 });
    }

    const wasApproved = review.status === "approved";

    review.status = "rejected";
    review.adminNote = adminNote?.trim() || undefined;
    review.moderatedBy = adminId;
    review.moderatedAt = new Date();
    await review.save();

    // Only recalculate if status actually changed (removing from approved pool)
    if (wasApproved) {
        await recalculateProductRatings(review.product);
    }

    logger.info("Review rejected", {
        reviewId,
        adminId,
        productId: review.product,
    });
    return review;
};

/**
 * Hard-delete a review. Always triggers recalculation.
 */
export const deleteReview = async (reviewId, adminId) => {
    const review = await Review.findById(reviewId).lean();
    if (!review) {
        throw Object.assign(new Error("Review not found"), { statusCode: 404 });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(reviewId);
    await recalculateProductRatings(productId);

    logger.info("Review deleted by admin", {
        reviewId,
        adminId,
        productId,
    });
};
