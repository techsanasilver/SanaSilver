import axiosInstance from "../utils/axios";
import logger from "../utils/logger.util";

const API_PREFIX = "/cart";

/**
 * Get user's cart
 * @param {array} guestCartItems - Guest cart items (optional)
 * @returns {Promise}
 */
export const getCart = async (guestCartItems = []) => {
    try {
        const response = await axiosInstance.post(API_PREFIX, {
            guestCart: guestCartItems,
        });
        logger.info("Cart fetched", {
            itemCount: response.data?.items?.length,
        });
        return response;
    } catch (error) {
        logger.error("Failed to fetch cart:", error);
        throw error;
    }
};

/**
 * Add item to cart
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity
 * @param {object} variant - Product variant (optional)
 * @returns {Promise}
 */
export const addToCart = async (productId, quantity = 1, variant = null) => {
    try {
        const response = await axiosInstance.post(`${API_PREFIX}/add`, {
            productId,
            quantity,
            variant,
        });
        logger.info("Item added to cart", { productId, quantity });
        return response;
    } catch (error) {
        logger.error("Failed to add to cart:", error);
        throw error;
    }
};

/**
 * Update cart item quantity
 * @param {string} productId - Product ID
 * @param {number} quantity - New quantity
 * @returns {Promise}
 */
export const updateCartItem = async (productId, quantity) => {
    try {
        const response = await axiosInstance.put(`${API_PREFIX}/update`, {
            productId,
            quantity,
        });
        logger.info("Cart item updated", { productId, quantity });
        return response;
    } catch (error) {
        logger.error("Failed to update cart item:", error);
        throw error;
    }
};

/**
 * Remove item from cart
 * @param {string} productId - Product ID
 * @returns {Promise}
 */
export const removeFromCart = async (productId) => {
    try {
        const response = await axiosInstance.delete(`${API_PREFIX}/remove`, {
            data: { productId },
        });
        logger.info("Item removed from cart", { productId });
        return response;
    } catch (error) {
        logger.error("Failed to remove from cart:", error);
        throw error;
    }
};

/**
 * Clear entire cart
 * @returns {Promise}
 */
export const clearCart = async () => {
    try {
        const response = await axiosInstance.delete(`${API_PREFIX}/clear`);
        logger.info("Cart cleared");
        return response;
    } catch (error) {
        logger.error("Failed to clear cart:", error);
        throw error;
    }
};
