import axiosInstance from "../utils/axios";
import logger from "../utils/logger.util";

const API_PREFIX = "/client/coupons";

/**
 * Get available coupons
 * @returns {Promise}
 */
export const getAvailableCoupons = async () => {
    try {
        const response = await axiosInstance.get(`${API_PREFIX}/available`);
        logger.info("Available coupons fetched", {
            count: response.data?.coupons?.length,
        });
        return response;
    } catch (error) {
        logger.error("Failed to fetch coupons:", error);
        throw error;
    }
};

/**
 * Validate coupon code
 * @param {string} couponCode - Coupon code
 * @returns {Promise}
 */
export const validateCoupon = async (couponCode) => {
    try {
        const response = await axiosInstance.post(`${API_PREFIX}/validate`, {
            couponCode,
        });
        logger.info("Coupon validated", { couponCode });
        return response;
    } catch (error) {
        logger.error("Failed to validate coupon:", error);
        throw error;
    }
};
