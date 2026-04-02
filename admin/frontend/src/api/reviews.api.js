import axiosInstance from "../utils/axios";

/**
 * List all reviews with filters and pagination.
 * @param {Object} params
 * @param {string} params.status - "approved" | "rejected" | "" (all)
 * @param {number} params.rating - 1–5
 * @param {string} params.sortBy - "newest" | "oldest" | "highest" | "lowest"
 * @param {string} params.dateFrom - ISO date string
 * @param {string} params.dateTo   - ISO date string
 * @param {number} params.page
 * @param {number} params.limit
 */
export const listReviews = async (params = {}) => {
    const response = await axiosInstance.get("/reviews", { params });
    return response.data;
};

/**
 * Get a single review by ID (full population).
 * @param {string} id
 */
export const getReviewById = async (id) => {
    const response = await axiosInstance.get(`/reviews/${id}`);
    return response.data;
};

/**
 * Approve a review.
 * @param {string} id
 */
export const approveReview = async (id) => {
    const response = await axiosInstance.put(`/reviews/${id}/approve`);
    return response.data;
};

/**
 * Reject a review with an optional admin note.
 * @param {string} id
 * @param {string} adminNote
 */
export const rejectReview = async (id, adminNote = "") => {
    const response = await axiosInstance.put(`/reviews/${id}/reject`, {
        adminNote,
    });
    return response.data;
};

/**
 * Hard-delete a review.
 * @param {string} id
 */
export const deleteReview = async (id) => {
    const response = await axiosInstance.delete(`/reviews/${id}`);
    return response.data;
};
