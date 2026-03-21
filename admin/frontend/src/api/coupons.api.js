import axiosInstance from "../utils/axios";

/**
 * Get all coupons
 * @param {Object} params - Optional query params (isActive, discountType, validStatus, page, limit)
 * @returns {Promise<Object>}
 */
export const getAllCoupons = async (params = {}) => {
    const response = await axiosInstance.get("/coupons", { params });
    return response.data;
};

/**
 * Get coupon by ID
 * @param {string} id - Coupon ID
 * @returns {Promise<Object>}
 */
export const getCouponById = async (id) => {
    const response = await axiosInstance.get(`/coupons/${id}`);
    return response.data;
};

/**
 * Create new coupon
 * @param {Object} data - Coupon data
 * @returns {Promise<Object>}
 */
export const createCoupon = async (data) => {
    const response = await axiosInstance.post("/coupons", data);
    return response.data;
};

/**
 * Update coupon
 * @param {string} id - Coupon ID
 * @param {Object} data - Updated fields
 * @returns {Promise<Object>}
 */
export const updateCoupon = async (id, data) => {
    const response = await axiosInstance.put(`/coupons/${id}`, data);
    return response.data;
};

/**
 * Delete coupon
 * @param {string} id - Coupon ID
 * @returns {Promise<Object>}
 */
export const deleteCoupon = async (id) => {
    const response = await axiosInstance.delete(`/coupons/${id}`);
    return response.data;
};

/**
 * Toggle coupon active status
 * @param {string} id - Coupon ID
 * @returns {Promise<Object>}
 */
export const toggleCouponStatus = async (id) => {
    const response = await axiosInstance.patch(`/coupons/${id}/toggle-status`);
    return response.data;
};

/**
 * Get coupon statistics
 * @param {string} id - Coupon ID
 * @returns {Promise<Object>}
 */
export const getCouponStats = async (id) => {
    const response = await axiosInstance.get(`/coupons/${id}/stats`);
    return response.data;
};

/**
 * Get coupon usage history
 * @param {string} id - Coupon ID
 * @returns {Promise<Object>}
 */
export const getCouponUsageHistory = async (id) => {
    const response = await axiosInstance.get(`/coupons/${id}/usage-history`);
    return response.data;
};
