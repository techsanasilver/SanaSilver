import axiosInstance from "../utils/axios";

/**
 * Get all orders with filters and pagination
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {string} params.status - Filter by order status
 * @param {string} params.paymentStatus - Filter by payment status
 * @param {string} params.startDate - Filter orders from this date
 * @param {string} params.endDate - Filter orders until this date
 * @param {string} params.searchTerm - Search by order number, customer name or phone
 * @returns {Promise<Object>}
 */
export const getAllOrders = async (params = {}) => {
    const response = await axiosInstance.get("/orders", { params });
    return response.data;
};

/**
 * Get order statistics for dashboard
 * @param {string} period - Time period (today, week, month, all)
 * @returns {Promise<Object>}
 */
export const getOrderStats = async (period = "week") => {
    const response = await axiosInstance.get("/orders/stats", {
        params: { period },
    });
    return response.data;
};

/**
 * Get orders needing refund processing
 * @returns {Promise<Object>}
 */
export const getRefundPendingOrders = async () => {
    const response = await axiosInstance.get("/orders/refund-pending");
    return response.data;
};

/**
 * Get single order details by ID
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>}
 */
export const getOrderById = async (orderId) => {
    const response = await axiosInstance.get(`/orders/${orderId}`);
    return response.data;
};

/**
 * Update order status
 * @param {string} orderId - Order ID
 * @param {Object} data - Status update data
 * @param {string} data.status - New status (pending, confirmed, processing, shipped, delivered, cancelled)
 * @param {string} data.note - Optional admin note
 * @returns {Promise<Object>}
 */
export const updateOrderStatus = async (orderId, data) => {
    const response = await axiosInstance.patch(
        `/orders/${orderId}/status`,
        data,
    );
    return response.data;
};

/**
 * Add shipping details to order
 * @param {string} orderId - Order ID
 * @param {Object} shippingDetails - Shipping information
 * @param {string} shippingDetails.courier - Courier name
 * @param {string} shippingDetails.trackingNumber - Tracking number
 * @param {string} shippingDetails.estimatedDelivery - Estimated delivery date
 * @returns {Promise<Object>}
 */
export const addShippingDetails = async (orderId, shippingDetails) => {
    const response = await axiosInstance.patch(
        `/orders/${orderId}/shipping`,
        shippingDetails,
    );
    return response.data;
};

/**
 * Mark order as delivered
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>}
 */
export const markAsDelivered = async (orderId) => {
    const response = await axiosInstance.post(
        `/orders/${orderId}/mark-delivered`,
    );
    return response.data;
};

/**
 * Cancel order (admin override)
 * @param {string} orderId - Order ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>}
 */
export const cancelOrder = async (orderId, reason) => {
    const response = await axiosInstance.post(`/orders/${orderId}/cancel`, {
        reason,
    });
    return response.data;
};

/**
 * Add admin note to order
 * @param {string} orderId - Order ID
 * @param {string} note - Note content
 * @returns {Promise<Object>}
 */
export const addAdminNote = async (orderId, note) => {
    const response = await axiosInstance.post(`/orders/${orderId}/notes`, {
        note,
    });
    return response.data;
};
