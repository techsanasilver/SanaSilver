import axiosInstance from "../utils/axios";
import logger from "../utils/logger.util";

const API_PREFIX = "/wishlist";

/**
 * Get user's wishlist
 * @returns {Promise}
 */
export const getWishlist = async () => {
    try {
        const response = await axiosInstance.get(API_PREFIX);
        logger.info("Wishlist fetched", {
            itemCount: response.data?.items?.length,
        });
        return response;
    } catch (error) {
        logger.error("Failed to fetch wishlist:", error);
        throw error;
    }
};

/**
 * Add product to wishlist
 * @param {string} productId - Product ID
 * @param {string} variantId - Variant ID
 * @returns {Promise}
 */
export const addToWishlist = async (productId, variantId) => {
    try {
        const response = await axiosInstance.post(`${API_PREFIX}/add`, {
            productId,
            variantId,
        });
        logger.info("Item added to wishlist", { productId, variantId });
        return response;
    } catch (error) {
        logger.error("Failed to add to wishlist:", error);
        throw error;
    }
};

/**
 * Remove product from wishlist
 * @param {string} productId - Product ID
 * @param {string} variantId - Variant ID
 * @returns {Promise}
 */
export const removeFromWishlist = async (productId, variantId) => {
    try {
        const response = await axiosInstance.delete(`${API_PREFIX}/remove`, {
            data: { productId, variantId },
        });
        logger.info("Item removed from wishlist", { productId, variantId });
        return response;
    } catch (error) {
        logger.error("Failed to remove from wishlist:", error);
        throw error;
    }
};

/**
 * Clear entire wishlist
 * @returns {Promise}
 */
export const clearWishlist = async () => {
    try {
        const response = await axiosInstance.delete(`${API_PREFIX}/clear`);
        logger.info("Wishlist cleared");
        return response;
    } catch (error) {
        logger.error("Failed to clear wishlist:", error);
        throw error;
    }
};
