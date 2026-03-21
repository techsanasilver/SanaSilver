import axiosInstance from "../utils/axios";
import logger from "../utils/logger.util";

const API_PREFIX = "/coupons";

/**
 * Get all available coupons for the user, including cart applicability status
 * GET /api/coupons/available
 * @returns {Promise}
 */
export const getAvailableCoupons = async () => {
    try {
        const response = await axiosInstance.get(`${API_PREFIX}/available`);
        logger.info("Available coupons fetched", {
            count: response.data?.data?.length,
        });
        return response;
    } catch (error) {
        logger.error("Failed to fetch available coupons:", error);
        throw error;
    }
};

/**
 * Apply a coupon to the cart (preview pricing, no persistence)
 * POST /api/coupons/apply
 * @param {string} couponCode - Coupon code
 * @param {Array} cartItems - Array of { price, quantity }
 * @returns {Promise}
 */
export const applyCoupon = async (couponCode, cartItems) => {
    try {
        const response = await axiosInstance.post(`${API_PREFIX}/apply`, {
            couponCode,
            cartItems,
        });
        logger.info("Coupon applied", { couponCode });
        return response;
    } catch (error) {
        logger.error("Failed to apply coupon:", error);
        throw error;
    }
};

/**
 * Validate a coupon code without applying it
 * POST /api/coupons/validate
 * @param {string} couponCode - Coupon code
 * @param {number} orderValue - Current order subtotal
 * @returns {Promise}
 */
export const validateCoupon = async (couponCode, orderValue) => {
    try {
        const response = await axiosInstance.post(`${API_PREFIX}/validate`, {
            couponCode,
            orderValue,
        });
        logger.info("Coupon validated", { couponCode });
        return response;
    } catch (error) {
        logger.error("Failed to validate coupon:", error);
        throw error;
    }
};
