import * as reviewService from "./review.service.js";
import apiResponse from "../../shared/utils/response.util.js";
import logger from "../../shared/utils/logger.util.js";

/**
 * GET /api/reviews
 * List all reviews with filters, sorting, pagination, and status summary.
 */
export const listReviewsController = async (req, res) => {
    try {
        const {
            status,
            productId,
            customerId,
            rating,
            dateFrom,
            dateTo,
            page = 1,
            limit = 20,
            sortBy = "newest",
        } = req.query;

        const filters = {
            status,
            productId,
            customerId,
            rating,
            dateFrom,
            dateTo,
        };
        const result = await reviewService.listReviews(filters, {
            page: parseInt(page),
            limit: Math.min(parseInt(limit), 100),
            sortBy,
        });

        return apiResponse.successWithMeta(
            res,
            "Reviews retrieved successfully",
            result.data,
            { pagination: result.pagination, summary: result.summary },
        );
    } catch (err) {
        logger.error("List reviews error:", err.message);
        return apiResponse.error(res, err.message);
    }
};

/**
 * GET /api/reviews/:id
 * Get a single review with full population.
 */
export const getReviewByIdController = async (req, res) => {
    try {
        const review = await reviewService.getReviewById(req.params.id);
        return apiResponse.success(
            res,
            "Review retrieved successfully",
            review,
        );
    } catch (err) {
        logger.error("Get review error:", err.message);
        if (err.statusCode === 404)
            return apiResponse.notFound(res, err.message);
        return apiResponse.error(res, err.message);
    }
};

/**
 * PUT /api/reviews/:id/approve
 * Approve a review → triggers product rating recalculation.
 */
export const approveReviewController = async (req, res) => {
    try {
        const review = await reviewService.approveReview(
            req.params.id,
            req.admin._id,
        );
        return apiResponse.success(res, "Review approved successfully", review);
    } catch (err) {
        logger.error("Approve review error:", err.message);
        if (err.statusCode === 404)
            return apiResponse.notFound(res, err.message);
        return apiResponse.error(res, err.message);
    }
};

/**
 * PUT /api/reviews/:id/reject
 * Reject a review with an optional admin note.
 * Body: { adminNote?: string }
 */
export const rejectReviewController = async (req, res) => {
    try {
        const { adminNote } = req.body;
        const review = await reviewService.rejectReview(
            req.params.id,
            req.admin._id,
            adminNote,
        );
        return apiResponse.success(res, "Review rejected successfully", review);
    } catch (err) {
        logger.error("Reject review error:", err.message);
        if (err.statusCode === 404)
            return apiResponse.notFound(res, err.message);
        return apiResponse.error(res, err.message);
    }
};

/**
 * DELETE /api/reviews/:id
 * Hard-delete a review → triggers product rating recalculation.
 */
export const deleteReviewController = async (req, res) => {
    try {
        await reviewService.deleteReview(req.params.id, req.admin._id);
        return apiResponse.success(res, "Review deleted successfully");
    } catch (err) {
        logger.error("Delete review error:", err.message);
        if (err.statusCode === 404)
            return apiResponse.notFound(res, err.message);
        return apiResponse.error(res, err.message);
    }
};
