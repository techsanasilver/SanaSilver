import axiosInstance from "../utils/axios";
import logger from "../utils/logger.util";

const API_PREFIX = "/orders";

/**
 * Get all user orders
 * @param {object} params - Query parameters (page, limit, status)
 * @returns {Promise}
 */
export const getOrders = async (params = {}) => {
    try {
        const response = await axiosInstance.get(API_PREFIX, { params });
        logger.info("Orders fetched", { count: response.data?.orders?.length });
        return response;
    } catch (error) {
        logger.error("Failed to fetch orders:", error);
        throw error;
    }
};

/**
 * Get order by ID
 * @param {string} orderId - Order ID
 * @returns {Promise}
 */
export const getOrderById = async (orderId) => {
    try {
        const response = await axiosInstance.get(`${API_PREFIX}/${orderId}`);
        logger.info("Order fetched", { orderId });
        return response;
    } catch (error) {
        logger.error("Failed to fetch order:", error);
        throw error;
    }
};

/**
 * Get order by order number
 * @param {string} orderNumber - Human-readable order number (e.g. ORD-2024-0001)
 * @returns {Promise}
 */
export const getOrderByNumber = async (orderNumber) => {
    try {
        const response = await axiosInstance.get(
            `${API_PREFIX}/number/${encodeURIComponent(orderNumber)}`,
        );
        logger.info("Order fetched by number", { orderNumber });
        return response;
    } catch (error) {
        logger.error("Failed to fetch order by number:", error);
        throw error;
    }
};

/**
 * Cancel order
 * @param {string} orderId - Order ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise}
 */
export const cancelOrder = async (orderId, reason) => {
    try {
        const response = await axiosInstance.post(
            `${API_PREFIX}/${orderId}/cancel`,
            {
                reason,
            },
        );
        logger.info("Order cancelled", { orderId });
        return response;
    } catch (error) {
        logger.error("Failed to cancel order:", error);
        throw error;
    }
};

/**
 * Track order
 * @param {string} orderId - Order ID
 * @returns {Promise}
 */
export const trackOrder = async (orderId) => {
    try {
        const response = await axiosInstance.get(
            `${API_PREFIX}/${orderId}/track`,
        );
        logger.info("Order tracking fetched", { orderId });
        return response;
    } catch (error) {
        logger.error("Failed to track order:", error);
        throw error;
    }
};

/**
 * Download invoice
 * @param {string} orderId - Order ID
 * @returns {Promise}
 */
export const downloadInvoice = async (orderId) => {
    try {
        const response = await axiosInstance.get(
            `${API_PREFIX}/${orderId}/invoice`,
            {
                responseType: "blob",
            },
        );
        logger.info("Invoice downloaded", { orderId });
        return response;
    } catch (error) {
        logger.error("Failed to download invoice:", error);
        throw error;
    }
};
