/**
 * Global Error Handler Utility
 * Centralized error handling and user notification system
 */

import logger from "./logger.util";

/**
 * Error types for categorization
 */
export const ERROR_TYPES = {
    VALIDATION: "VALIDATION",
    AUTHENTICATION: "AUTHENTICATION",
    AUTHORIZATION: "AUTHORIZATION",
    NETWORK: "NETWORK",
    SERVER: "SERVER",
    NOT_FOUND: "NOT_FOUND",
    UNKNOWN: "UNKNOWN",
};

/**
 * Determine error type from error object
 */
const determineErrorType = (error) => {
    if (!error.response) {
        return ERROR_TYPES.NETWORK;
    }

    const { status } = error.response;

    switch (status) {
        case 400:
        case 422:
            return ERROR_TYPES.VALIDATION;
        case 401:
            return ERROR_TYPES.AUTHENTICATION;
        case 403:
            return ERROR_TYPES.AUTHORIZATION;
        case 404:
            return ERROR_TYPES.NOT_FOUND;
        case 500:
        case 502:
        case 503:
            return ERROR_TYPES.SERVER;
        default:
            return ERROR_TYPES.UNKNOWN;
    }
};

/**
 * Get user-friendly error message
 */
const getUserMessage = (error, errorType) => {
    // Custom message from server
    if (error.response?.data?.message) {
        return error.response.data.message;
    }

    // Default messages by type
    switch (errorType) {
        case ERROR_TYPES.VALIDATION:
            return "Please check your input and try again.";
        case ERROR_TYPES.AUTHENTICATION:
            return "Your session has expired. Please login again.";
        case ERROR_TYPES.AUTHORIZATION:
            return "You do not have permission to perform this action.";
        case ERROR_TYPES.NETWORK:
            return "Network error. Please check your internet connection.";
        case ERROR_TYPES.SERVER:
            return "Server error. Please try again later.";
        case ERROR_TYPES.NOT_FOUND:
            return "The requested resource was not found.";
        default:
            return "An unexpected error occurred. Please try again.";
    }
};

/**
 * Global error handler
 * @param {Error} error - The error object
 * @param {Object} options - Additional options
 * @param {Function} options.showNotification - Function to show error notification (e.g., toast)
 * @param {Boolean} options.redirect - Whether to redirect on auth errors
 * @param {Boolean} options.log - Whether to log error (default: true)
 */
export const handleError = (error, options = {}) => {
    const { showNotification = null, redirect = true, log = true } = options;

    // Log error if enabled
    if (log) {
        logger.error("Error Handler:", error);
    }

    // Determine error type
    const errorType = determineErrorType(error);

    // Get user-friendly message
    const userMessage = getUserMessage(error, errorType);

    // Show notification if provided
    if (showNotification && typeof showNotification === "function") {
        showNotification(userMessage, "error");
    }

    // Handle authentication errors
    if (errorType === ERROR_TYPES.AUTHENTICATION && redirect) {
        // Clear auth data
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        // Redirect to login after short delay
        setTimeout(() => {
            window.location.href = "/login";
        }, 1500);
    }

    // Return error info for component-level handling
    return {
        type: errorType,
        message: userMessage,
        originalError: error,
    };
};

/**
 * Validation error extractor
 * Extracts validation errors from API response
 */
export const extractValidationErrors = (error) => {
    if (!error.response?.data?.errors) {
        return {};
    }

    const errors = error.response.data.errors;

    // Convert array of errors to field-keyed object
    if (Array.isArray(errors)) {
        return errors.reduce((acc, err) => {
            if (err.field) {
                acc[err.field] = err.message;
            }
            return acc;
        }, {});
    }

    // If already an object, return as is
    if (typeof errors === "object") {
        return errors;
    }

    return {};
};

/**
 * React Error Boundary handler
 */
export const logErrorToBoundary = (error, errorInfo) => {
    logger.error("React Error Boundary caught error:", {
        error,
        componentStack: errorInfo.componentStack,
    });

    // Here you could send error to error tracking service (e.g., Sentry)
    // sendToErrorTrackingService(error, errorInfo);
};

export default {
    handleError,
    extractValidationErrors,
    logErrorToBoundary,
    ERROR_TYPES,
};
