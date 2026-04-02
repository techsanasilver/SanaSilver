import mongoose from "mongoose";
import Review from "./review.model.js";
import Product from "../products/product.model.js";
import Order from "../orders/order.model.js";
import logger from "../../shared/utils/logger.util.js";

// ─── Private helper ───────────────────────────────────────────────────────────

/**
 * Recompute product.ratings.average and product.ratings.count
 * from scratch using an aggregation — safe against race conditions.
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
 * Check whether a customer can review a given product.
 * Returns canReview flag, their existing review (if any), and a reason string.
 */
export const checkCanReview = async (customerId, productId) => {
    const product = await Product.findById(productId).lean();
    if (!product || !product.isActive) {
        return {
            canReview: false,
            existingReview: null,
            reason: "product_not_found",
        };
    }

    const existingReview = await Review.findOne({
        product: productId,
        customer: customerId,
    }).lean();

    if (existingReview) {
        return {
            canReview: false,
            existingReview,
            reason: "already_reviewed",
        };
    }

    const deliveredOrder = await Order.findOne({
        customer: customerId,
        orderStatus: "delivered",
        "items.product": productId,
    }).lean();

    if (!deliveredOrder) {
        return {
            canReview: false,
            existingReview: null,
            reason: "no_delivered_order",
        };
    }

    return {
        canReview: true,
        existingReview: null,
        reason: null,
    };
};

/**
 * Submit a new review. Enforces:
 *  - product exists and is active
 *  - customer has a delivered order containing the product
 *  - customer hasn't already reviewed this product
 */
export const submitReview = async (
    customerId,
    customerName,
    { productId, rating, title, body },
) => {
    const product = await Product.findById(productId).lean();
    if (!product || !product.isActive) {
        throw Object.assign(new Error("Product not found"), {
            statusCode: 404,
        });
    }

    const existing = await Review.findOne({
        product: productId,
        customer: customerId,
    }).lean();
    if (existing) {
        throw Object.assign(
            new Error("You have already reviewed this product"),
            { statusCode: 409 },
        );
    }

    const deliveredOrder = await Order.findOne({
        customer: customerId,
        orderStatus: "delivered",
        "items.product": productId,
    }).lean();
    if (!deliveredOrder) {
        throw Object.assign(
            new Error("You can only review products from delivered orders"),
            { statusCode: 403 },
        );
    }

    const review = await Review.create({
        product: productId,
        customer: customerId,
        customerName,
        order: deliveredOrder._id,
        rating,
        title: title?.trim() || undefined,
        body: body.trim(),
        isVerifiedPurchase: true,
    });

    await recalculateProductRatings(productId);
    logger.info("Review submitted", {
        customerId,
        productId,
        reviewId: review._id,
    });

    return review;
};

/**
 * Edit an existing review. Only the review's owner may edit.
 * If the review was rejected by admin, editing resets it to approved.
 */
export const editReview = async (
    customerId,
    reviewId,
    { rating, title, body },
) => {
    const review = await Review.findById(reviewId);
    if (!review) {
        throw Object.assign(new Error("Review not found"), { statusCode: 404 });
    }
    if (review.customer.toString() !== customerId.toString()) {
        throw Object.assign(new Error("You can only edit your own reviews"), {
            statusCode: 403,
        });
    }

    review.rating = rating;
    review.title = title?.trim() || undefined;
    review.body = body.trim();

    // A rejected review that gets edited should be re-evaluated
    if (review.status === "rejected") {
        review.status = "approved";
        review.adminNote = undefined;
        review.moderatedBy = undefined;
        review.moderatedAt = undefined;
    }

    await review.save();
    await recalculateProductRatings(review.product);
    logger.info("Review edited", { customerId, reviewId });

    return review;
};

/**
 * Delete a review. Only the review's owner may delete.
 */
export const deleteReview = async (customerId, reviewId) => {
    const review = await Review.findById(reviewId).lean();
    if (!review) {
        throw Object.assign(new Error("Review not found"), { statusCode: 404 });
    }
    if (review.customer.toString() !== customerId.toString()) {
        throw Object.assign(new Error("You can only delete your own reviews"), {
            statusCode: 403,
        });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(reviewId);
    await recalculateProductRatings(productId);
    logger.info("Review deleted", { customerId, reviewId });
};

/**
 * Get paginated approved reviews for a product, plus an aggregated summary.
 */
export const getProductReviews = async (
    productId,
    { page = 1, limit = 10, sortBy = "recent", rating } = {},
) => {
    const skip = (page - 1) * limit;

    const matchQuery = {
        product: new mongoose.Types.ObjectId(productId),
        status: "approved",
    };
    if (rating) matchQuery.rating = Number(rating);

    const sortMap = {
        recent: { createdAt: -1 },
        highest: { rating: -1, createdAt: -1 },
        lowest: { rating: 1, createdAt: -1 },
    };
    const sort = sortMap[sortBy] ?? sortMap.recent;

    const [reviews, total, distribution] = await Promise.all([
        Review.find(matchQuery)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .select(
                "customerName rating title body createdAt isVerifiedPurchase",
            )
            .lean(),
        Review.countDocuments(matchQuery),
        Review.aggregate([
            {
                $match: {
                    product: new mongoose.Types.ObjectId(productId),
                    status: "approved",
                },
            },
            { $group: { _id: "$rating", count: { $sum: 1 } } },
        ]),
    ]);

    // Build { 1: n, 2: n, 3: n, 4: n, 5: n }
    const distMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach((d) => {
        distMap[d._id] = d.count;
    });

    const totalApproved = Object.values(distMap).reduce((a, b) => a + b, 0);
    const weightedSum = Object.entries(distMap).reduce(
        (a, [star, count]) => a + Number(star) * count,
        0,
    );
    const average =
        totalApproved > 0
            ? Math.round((weightedSum / totalApproved) * 10) / 10
            : 0;

    return {
        data: reviews,
        summary: {
            average,
            count: totalApproved,
            distribution: distMap,
        },
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get all reviews written by a specific customer (their own review history).
 */
export const getMyReviews = async (
    customerId,
    { page = 1, limit = 10 } = {},
) => {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
        Review.find({ customer: customerId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("product", "name slug images")
            .lean(),
        Review.countDocuments({ customer: customerId }),
    ]);

    return {
        data: reviews,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
};
