import axiosInstance from "../utils/axios";
import logger from "../utils/logger.util";

const API_PREFIX = "/client/wishlist";

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
 * @returns {Promise}
 */
export const addToWishlist = async (productId) => {
    try {
        const response = await axiosInstance.post(`${API_PREFIX}/add`, {
            productId,
        });
        logger.info("Item added to wishlist", { productId });
        return response;
    } catch (error) {
        logger.error("Failed to add to wishlist:", error);
        throw error;
    }
};

/**
 * Remove product from wishlist
 * @param {string} productId - Product ID
 * @returns {Promise}
 */
export const removeFromWishlist = async (productId) => {
    try {
        const response = await axiosInstance.delete(`${API_PREFIX}/remove`, {
            data: { productId },
        });
        logger.info("Item removed from wishlist", { productId });
        return response;
    } catch (error) {
        logger.error("Failed to remove from wishlist:", error);
        throw error;
    }
};
