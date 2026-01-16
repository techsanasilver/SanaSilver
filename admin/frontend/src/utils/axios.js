/**
 * Axios Configuration
 * Centralized HTTP client with cookie-based authentication and refresh token handling
 */

import axios from "axios";
import logger from "./logger.util";

// Base URL from environment variable
const BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * Create axios instance with default config
 * withCredentials: true - Send cookies with every request
 */
const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    withCredentials: true, // Important: Send cookies with requests
    headers: {
        "Content-Type": "application/json",
    },
});

/**
 * Request Interceptor
 * Log requests in development (tokens are automatically sent via cookies)
 */
axiosInstance.interceptors.request.use(
    (config) => {
        // Log API request in development
        logger.apiRequest(config.method, config.url, config.data);

        return config;
    },
    (error) => {
        logger.error("Request Interceptor Error:", error);
        return Promise.reject(error);
    }
);

/**
 * Response Interceptor
 * Handle errors, token refresh, and logging
 */
axiosInstance.interceptors.response.use(
    (response) => {
        // Log successful response in development
        logger.apiResponse(
            response.config.method,
            response.config.url,
            response.status,
            response.data
        );

        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Log error response
        if (error.response) {
            logger.apiResponse(
                error.config.method,
                error.config.url,
                error.response.status,
                error.response.data
            );
        } else {
            logger.error("Network Error:", error);
        }

        // Handle 401 Unauthorized - Token Expired
        // Don't try to refresh on login endpoint (wrong credentials scenario)
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes("/auth/login")
        ) {
            originalRequest._retry = true;

            try {
                // Call refresh token endpoint (refreshToken cookie sent automatically)
                await axios.post(
                    `${BASE_URL}/auth/refresh-token`,
                    {},
                    { withCredentials: true }
                );

                logger.info("Token refreshed successfully");

                // Retry original request (new accessToken cookie set by server)
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                // Refresh failed - redirect to login
                logger.error("Token refresh failed:", refreshError);

                // Clear user data from localStorage
                localStorage.removeItem("user");

                // Dispatch custom event for AuthContext to handle
                window.dispatchEvent(new Event("auth:logout"));

                // Redirect to login
                window.location.href = "/login";

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

/**
 * Helper function to handle API errors
 */
export const handleApiError = (error) => {
    if (error.response) {
        // Server responded with error status
        const { status, data } = error.response;

        switch (status) {
            case 400:
                return data.message || "Bad Request";
            case 401:
                return "Unauthorized. Please login again.";
            case 403:
                return "You do not have permission to perform this action.";
            case 404:
                return "Resource not found.";
            case 409:
                return data.message || "Conflict. Resource already exists.";
            case 422:
                return data.message || "Validation failed.";
            case 500:
                return "Internal server error. Please try again later.";
            default:
                return data.message || "An error occurred.";
        }
    } else if (error.request) {
        // Request made but no response
        return "Network error. Please check your connection.";
    } else {
        // Something else happened
        return error.message || "An unexpected error occurred.";
    }
};

export default axiosInstance;
