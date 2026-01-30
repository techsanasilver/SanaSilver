import * as authService from "./auth.service.js";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    getAccessTokenCookieOptions,
    getRefreshTokenCookieOptions,
} from "../../shared/utils/jwt.util.js";
import apiResponse from "../../shared/utils/response.util.js";
import logger from "../../shared/utils/logger.util.js";
import User from "./user.model.js";

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP to phone number
 * @access  Public
 */
const sendOTP = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return apiResponse.badRequest(res, "Phone number is required");
        }

        const result = await authService.sendOTP(phone);

        return apiResponse.success(res, result.message, {
            phone: result.phone,
            // Only in development
            ...(result.otp && { otp: result.otp }),
        });
    } catch (error) {
        logger.error("Send OTP error:", error.message);

        if (
            error.message.includes("Invalid") ||
            error.message.includes("Too many")
        ) {
            return apiResponse.badRequest(res, error.message);
        }

        return apiResponse.serverError(res, "Failed to send OTP");
    }
};

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and authenticate user
 * @access  Public
 */
const verifyOTP = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return apiResponse.badRequest(
                res,
                "Phone number and OTP are required",
            );
        }

        const { user, isNewUser } = await authService.verifyOTP(phone, otp);

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Set cookies
        res.cookie("accessToken", accessToken, getAccessTokenCookieOptions());
        res.cookie(
            "refreshToken",
            refreshToken,
            getRefreshTokenCookieOptions(),
        );

        logger.info(`User logged in: ${user._id} (${user.phone})`);

        return apiResponse.success(res, "Login successful", {
            user: {
                _id: user._id,
                phone: user.phone,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                isNewUser,
            },
            accessToken,
        });
    } catch (error) {
        logger.error("Verify OTP error:", error.message);

        if (
            error.message.includes("Invalid") ||
            error.message.includes("expired") ||
            error.message.includes("exceeded") ||
            error.message.includes("not found") ||
            error.message.includes("deactivated")
        ) {
            return apiResponse.badRequest(res, error.message);
        }

        return apiResponse.serverError(res, "Failed to verify OTP");
    }
};

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
const refreshToken = async (req, res) => {
    try {
        const refreshTokenFromCookie = req.cookies.refreshToken;

        if (!refreshTokenFromCookie) {
            return apiResponse.unauthorized(res, "Refresh token required");
        }

        // Verify refresh token
        let decoded;
        try {
            decoded = verifyRefreshToken(refreshTokenFromCookie);
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return apiResponse.unauthorized(
                    res,
                    "Refresh token expired. Please login again",
                );
            }
            return apiResponse.unauthorized(res, "Invalid refresh token");
        }

        // Find user
        const user = await User.findById(decoded.userId);

        if (!user) {
            return apiResponse.unauthorized(res, "User not found");
        }

        if (!user.isActive) {
            return apiResponse.forbidden(res, "User account is deactivated");
        }

        // Check token version
        if (decoded.tokenVersion !== user.tokenVersion) {
            return apiResponse.unauthorized(
                res,
                "Token has been invalidated. Please login again",
            );
        }

        // Generate new access token
        const newAccessToken = generateAccessToken(user);

        // Set new access token cookie
        res.cookie(
            "accessToken",
            newAccessToken,
            getAccessTokenCookieOptions(),
        );

        logger.info(`Token refreshed for user: ${user._id}`);

        return apiResponse.success(res, "Token refreshed successfully", {
            accessToken: newAccessToken,
        });
    } catch (error) {
        logger.error("Refresh token error:", error.message);
        return apiResponse.serverError(res, "Failed to refresh token");
    }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
const logout = async (req, res) => {
    try {
        // Clear cookies
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        logger.info(`User logged out: ${req.user?.userId || "unknown"}`);

        return apiResponse.success(res, "Logged out successfully");
    } catch (error) {
        logger.error("Logout error:", error.message);
        return apiResponse.serverError(res, "Failed to logout");
    }
};

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private
 */
const getProfile = async (req, res) => {
    try {
        const user = await authService.getUserProfile(req.user.userId);

        return apiResponse.success(res, "Profile fetched successfully", {
            user: {
                _id: user._id,
                phone: user.phone,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                addresses: user.addresses,
                lastLoginAt: user.lastLoginAt,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        logger.error("Get profile error:", error.message);

        if (error.message.includes("not found")) {
            return apiResponse.notFound(res, error.message);
        }

        return apiResponse.serverError(res, "Failed to fetch profile");
    }
};

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
    try {
        const updateData = req.body;

        const user = await authService.updateUserProfile(
            req.user.userId,
            updateData,
        );

        return apiResponse.success(res, "Profile updated successfully", {
            user: {
                _id: user._id,
                phone: user.phone,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                addresses: user.addresses,
            },
        });
    } catch (error) {
        logger.error("Update profile error:", error.message);

        if (error.message.includes("not found")) {
            return apiResponse.notFound(res, error.message);
        }

        if (error.name === "ValidationError") {
            return apiResponse.validationError(res, error.message);
        }

        return apiResponse.serverError(res, "Failed to update profile");
    }
};

export { sendOTP, verifyOTP, refreshToken, logout, getProfile, updateProfile };
