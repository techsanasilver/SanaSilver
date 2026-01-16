/**
 * Authentication API
 * Handles login, logout, token refresh, and profile operations
 * Backend uses cookie-based authentication with httpOnly cookies
 */

import axiosInstance from "../utils/axios";

/**
 * Login with email and password
 * Returns admin data (tokens are set as httpOnly cookies by server)
 */
export const login = async (email, password) => {
    const response = await axiosInstance.post("/auth/login", {
        email,
        password,
    });
    return response.data;
};

/**
 * Logout (invalidate tokens and clear cookies)
 */
export const logout = async () => {
    const response = await axiosInstance.post("/auth/logout");
    return response.data;
};

/**
 * Refresh access token
 * refreshToken cookie is sent automatically
 */
export const refreshToken = async () => {
    const response = await axiosInstance.post("/auth/refresh-token");
    return response.data;
};

/**
 * Get current admin profile
 */
export const getProfile = async () => {
    const response = await axiosInstance.get("/auth/me");
    return response.data;
};

/**
 * Update admin profile
 */
export const updateProfile = async (profileData) => {
    const response = await axiosInstance.put(
        "/auth/update-profile",
        profileData
    );
    return response.data;
};

/**
 * Change password
 */
export const changePassword = async (currentPassword, newPassword) => {
    const response = await axiosInstance.put("/auth/change-password", {
        currentPassword,
        newPassword,
    });
    return response.data;
};

export default {
    login,
    logout,
    refreshToken,
    getProfile,
    updateProfile,
    changePassword,
};
