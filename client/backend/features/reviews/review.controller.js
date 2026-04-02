import * as reviewService from "./review.service.js";
import apiResponse from "../../shared/utils/response.util.js";
import logger from "../../shared/utils/logger.util.js";

// ─── Validation helper ────────────────────────────────────────────────────────

const validateReviewFields = ({ rating, body, title }) => {
    if (!rating) return "rating is required";
    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
        return "Rating must be an integer between 1 and 5";
    }
    if (!body || body.trim().length < 10) {
        return "Review body must be at least 10 characters";
    }
    if (body.trim().length > 1000) {
        return "Review body cannot exceed 1000 characters";
    }
    if (title && title.trim().length > 100) {
        return "Title cannot exceed 100 characters";
    }
    return null;
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/products/:productId/reviews
 * Public — returns approved reviews + rating summary for a product.
 */
export const getProductReviewsController = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10, sortBy = "recent", rating } = req.query;

        const result = await reviewService.getProductReviews(productId, {
            page: parseInt(page),
            limit: Math.min(parseInt(limit), 50),
            sortBy,
            rating,
        });

        return apiResponse.successWithMeta(
            res,
            "Reviews retrieved successfully",
            result.data,
            { pagination: result.pagination, summary: result.summary },
        );
    } catch (err) {
        logger.error("Get product reviews error:", err.message);
        return apiResponse.error(res, err.message);
    }
};

/**
 * GET /api/reviews/can-review/:productId
 * Protected — can the authenticated user review this product?
 */
export const canReviewController = async (req, res) => {
    try {
        const { productId } = req.params;
        const result = await reviewService.checkCanReview(
            req.user.userId,
            productId,
        );
        return apiResponse.success(res, "Can review status retrieved", result);
    } catch (err) {
        logger.error("Can review check error:", err.message);
        return apiResponse.error(res, err.message);
    }
};

/**
 * GET /api/reviews/my
 * Protected — returns the authenticated user's own reviews.
 */
export const getMyReviewsController = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const result = await reviewService.getMyReviews(req.user.userId, {
            page: parseInt(page),
            limit: parseInt(limit),
        });
        return apiResponse.successWithPagination(
            res,
            "Your reviews retrieved successfully",
            result.data,
            result.pagination,
        );
    } catch (err) {
        logger.error("Get my reviews error:", err.message);
        return apiResponse.error(res, err.message);
    }
};

/**
 * POST /api/reviews
 * Protected — submit a new review.
 */
export const submitReviewController = async (req, res) => {
    try {
        const { productId, rating, title, body } = req.body;

        if (!productId) {
            return apiResponse.badRequest(res, "productId is required");
        }
        const validationError = validateReviewFields({ rating, body, title });
        if (validationError) {
            return apiResponse.badRequest(res, validationError);
        }

        // Build display name: "Priya S." — first name + last initial
        const lastName = req.user.lastName || "";
        const customerName = lastName
            ? `${req.user.firstName} ${lastName.charAt(0)}.`
            : req.user.firstName;

        const review = await reviewService.submitReview(
            req.user.userId,
            customerName,
            { productId, rating: Number(rating), title, body },
        );

        return apiResponse.created(
            res,
            "Review submitted successfully",
            review,
        );
    } catch (err) {
        logger.error("Submit review error:", err.message);
        if (err.statusCode === 404)
            return apiResponse.notFound(res, err.message);
        if (err.statusCode === 403)
            return apiResponse.forbidden(res, err.message);
        if (err.statusCode === 409)
            return apiResponse.conflict(res, err.message);
        return apiResponse.error(res, err.message);
    }
};

/**
 * PUT /api/reviews/:id
 * Protected — edit the authenticated user's own review.
 */
export const editReviewController = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, title, body } = req.body;

        const validationError = validateReviewFields({ rating, body, title });
        if (validationError) {
            return apiResponse.badRequest(res, validationError);
        }

        const review = await reviewService.editReview(req.user.userId, id, {
            rating: Number(rating),
            title,
            body,
        });

        return apiResponse.success(res, "Review updated successfully", review);
    } catch (err) {
        logger.error("Edit review error:", err.message);
        if (err.statusCode === 404)
            return apiResponse.notFound(res, err.message);
        if (err.statusCode === 403)
            return apiResponse.forbidden(res, err.message);
        return apiResponse.error(res, err.message);
    }
};

/**
 * DELETE /api/reviews/:id
 * Protected — delete the authenticated user's own review.
 */
export const deleteReviewController = async (req, res) => {
    try {
        const { id } = req.params;
        await reviewService.deleteReview(req.user.userId, id);
        return apiResponse.success(res, "Review deleted successfully");
    } catch (err) {
        logger.error("Delete review error:", err.message);
        if (err.statusCode === 404)
            return apiResponse.notFound(res, err.message);
        if (err.statusCode === 403)
            return apiResponse.forbidden(res, err.message);
        return apiResponse.error(res, err.message);
    }
};
