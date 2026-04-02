import axiosInstance from "../utils/axios";
import logger from "../utils/logger.util";

export const getProductReviews = async (productId, params = {}) => {
    try {
        const response = await axiosInstance.get(
            `/products/${productId}/reviews`,
            { params },
        );
        logger.info("Fetched product reviews", { productId, params });
        return response.data;
    } catch (error) {
        logger.error("Failed to fetch product reviews", error);
        throw error;
    }
};

export const canReview = async (productId) => {
    try {
        const response = await axiosInstance.get(
            `/reviews/can-review/${productId}`,
        );
        logger.info("Checked can-review status", { productId });
        return response.data;
    } catch (error) {
        logger.error("Failed to check can-review status", error);
        throw error;
    }
};

export const getMyReviews = async (params = {}) => {
    try {
        const response = await axiosInstance.get("/reviews/my", { params });
        logger.info("Fetched my reviews", { params });
        return response.data;
    } catch (error) {
        logger.error("Failed to fetch my reviews", error);
        throw error;
    }
};

export const submitReview = async (data) => {
    try {
        const response = await axiosInstance.post("/reviews", data);
        logger.info("Submitted review", { productId: data.productId });
        return response.data;
    } catch (error) {
        logger.error("Failed to submit review", error);
        throw error;
    }
};

export const updateReview = async (id, data) => {
    try {
        const response = await axiosInstance.put(`/reviews/${id}`, data);
        logger.info("Updated review", { id });
        return response.data;
    } catch (error) {
        logger.error("Failed to update review", error);
        throw error;
    }
};

export const deleteReview = async (id) => {
    try {
        const response = await axiosInstance.delete(`/reviews/${id}`);
        logger.info("Deleted review", { id });
        return response.data;
    } catch (error) {
        logger.error("Failed to delete review", error);
        throw error;
    }
};
