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
            items: guestCartItems,
        });
        logger.info("Cart fetched", {
            itemCount: response.data?.data?.items?.length,
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
 * @param {string} variantId - Product variant ID
 * @param {number} quantity - Quantity
 * @returns {Promise}
 */
export const addToCart = async (productId, variantId, quantity = 1) => {
    try {
        const response = await axiosInstance.post(`${API_PREFIX}/add`, {
            productId,
            variantId,
            quantity,
        });
        logger.info("Item added to cart", { productId, variantId, quantity });
        return response;
    } catch (error) {
        logger.error("Failed to add to cart:", error);
        throw error;
    }
};

/**
 * Update cart item quantity
 * @param {string} productId - Product ID
 * @param {string} variantId - Product variant ID
 * @param {number} quantity - New quantity
 * @returns {Promise}
 */
export const updateCartItem = async (productId, variantId, quantity) => {
    try {
        const response = await axiosInstance.put(`${API_PREFIX}/update`, {
            productId,
            variantId,
            quantity,
        });
        logger.info("Cart item updated", { productId, variantId, quantity });
        return response;
    } catch (error) {
        logger.error("Failed to update cart item:", error);
        throw error;
    }
};

/**
 * Remove item from cart
 * @param {string} productId - Product ID
 * @param {string} variantId - Product variant ID
 * @returns {Promise}
 */
export const removeFromCart = async (productId, variantId) => {
    try {
        const response = await axiosInstance.delete(`${API_PREFIX}/remove`, {
            data: { productId, variantId },
        });
        logger.info("Item removed from cart", { productId, variantId });
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

/**
 * Merge guest cart with user cart on login
 * @param {array} guestCartItems - Guest cart items
 * @returns {Promise}
 */
export const mergeCart = async (guestCartItems = []) => {
    try {
        const response = await axiosInstance.post(`${API_PREFIX}/merge`, {
            guestCartItems,
        });
        logger.info("Guest cart merged", {
            itemCount: guestCartItems.length,
        });
        return response;
    } catch (error) {
        logger.error("Failed to merge cart:", error);
        throw error;
    }
};

/**
 * Get cart item count
 * @returns {Promise}
 */
export const getCartCount = async () => {
    try {
        const response = await axiosInstance.get(`${API_PREFIX}/count`);
        logger.info("Cart count fetched", {
            count: response.data?.data?.count,
        });
        return response;
    } catch (error) {
        logger.error("Failed to fetch cart count:", error);
        throw error;
    }
};
