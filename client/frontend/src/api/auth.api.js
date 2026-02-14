import axiosInstance from "../utils/axios";
import logger from "../utils/logger.util";

const API_PREFIX = "/auth";

/**
 * Send OTP to phone number
 * @param {string} phone - Phone number
 * @returns {Promise}
 */
export const sendOTP = async (phone) => {
    try {
        const response = await axiosInstance.post(`${API_PREFIX}/send-otp`, {
            phone,
        });
        logger.info("OTP sent successfully", { phone });
        return response;
    } catch (error) {
        logger.error("Failed to send OTP:", error);
        throw error;
    }
};

/**
 * Verify OTP - Handles both login and registration
 * Backend automatically creates account if user doesn't exist
 * @param {string} phone - Phone number
 * @param {string} otp - OTP code
 * @param {object} userData - Optional user data for new users (name, email)
 * @returns {Promise}
 */
export const verifyOTP = async (phone, otp, userData = {}) => {
    try {
        const response = await axiosInstance.post(`${API_PREFIX}/verify-otp`, {
            phone,
            otp,
            ...userData,
        });
        logger.info("OTP verified successfully", { phone });
        return response;
    } catch (error) {
        logger.error("OTP verification failed:", error);
        throw error;
    }
};

/**
 * Get user profile
 * @returns {Promise}
 */
export const getProfile = async () => {
    try {
        const response = await axiosInstance.get(`${API_PREFIX}/profile`);
        return response;
    } catch (error) {
        logger.error("Failed to get profile:", error);
        throw error;
    }
};

/**
 * Update user profile
 * @param {object} userData - Updated user data
 * @returns {Promise}
 */
export const updateProfile = async (userData) => {
    try {
        const response = await axiosInstance.put(
            `${API_PREFIX}/profile`,
            userData,
        );
        logger.info("Profile updated successfully");
        return response;
    } catch (error) {
        logger.error("Failed to update profile:", error);
        throw error;
    }
};

/**
 * Logout user
 * @returns {Promise}
 */
export const logout = async () => {
    try {
        const response = await axiosInstance.post(`${API_PREFIX}/logout`);
        logger.info("Logout successful");
        return response;
    } catch (error) {
        logger.error("Logout failed:", error);
        throw error;
    }
};

/**
 * Refresh access token
 * @returns {Promise}
 */
export const refreshToken = async () => {
    try {
        const response = await axiosInstance.post(
            `${API_PREFIX}/refresh-token`,
        );
        return response;
    } catch (error) {
        logger.error("Token refresh failed:", error);
        throw error;
    }
};
