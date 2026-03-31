import axiosInstance from "../utils/axios";

/**
 * Get invoice metadata for an order.
 * Returns null data (not 404) when no invoice exists yet.
 *
 * @param {string} orderId
 * @returns {Promise<Object>} API response — data.data is the invoice or null
 */
export const getInvoiceForOrder = async (orderId) => {
    const response = await axiosInstance.get(`/orders/${orderId}/invoice`);
    return response.data;
};

/**
 * Generate (create) a tax invoice for an order.
 * Returns 409 with existing invoiceId if one already exists.
 *
 * @param {string} orderId
 * @returns {Promise<Object>} API response — data.data has { invoiceId, invoiceNumber, orderId, orderNumber }
 */
export const generateInvoice = async (orderId) => {
    const response = await axiosInstance.post(`/orders/${orderId}/invoice`);
    return response.data;
};

/**
 * Download the PDF for a given invoice.
 * Returns an axios response with responseType: "blob".
 *
 * @param {string} invoiceId
 * @returns {Promise<AxiosResponse>} Blob response
 */
export const downloadInvoicePDF = async (invoiceId) => {
    const response = await axiosInstance.get(`/invoices/${invoiceId}/pdf`, {
        responseType: "blob",
    });
    return response;
};

/**
 * Cancel an active invoice.
 *
 * @param {string} invoiceId
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>}
 */
export const cancelInvoice = async (invoiceId, reason) => {
    const response = await axiosInstance.patch(
        `/invoices/${invoiceId}/cancel`,
        { reason },
    );
    return response.data;
};
