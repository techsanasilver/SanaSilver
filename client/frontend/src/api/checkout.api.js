import axiosInstance from "../utils/axios";
import logger from "../utils/logger.util";

const API_PREFIX = "/checkout";
const RAZORPAY_PREFIX = "/razorpay";

/**
 * Place order with Cash on Delivery
 * @param {object} orderData - { shippingAddressId, billingAddressId, paymentMethod, customerNote, couponCode }
 * @returns {Promise}
 */
export const placeOrderCOD = async (orderData) => {
    try {
        const response = await axiosInstance.post(
            `${API_PREFIX}/place-order-cod`,
            orderData,
        );
        logger.info("COD order placed", { orderId: response.data?.orderId });
        return response;
    } catch (error) {
        logger.error("Failed to place COD order:", error);
        throw error;
    }
};

/**
 * Cancel a pending Razorpay order (called on modal dismiss / abandonment)
 * @param {string} razorpayOrderId
 * @returns {Promise}
 */
export const cancelRazorpayOrder = async (razorpayOrderId) => {
    try {
        const response = await axiosInstance.delete(
            `${RAZORPAY_PREFIX}/pending-order`,
            { data: { razorpayOrderId } },
        );
        logger.info("Razorpay pending order cancelled", { razorpayOrderId });
        return response;
    } catch (error) {
        logger.error("Failed to cancel Razorpay order:", error);
        throw error;
    }
};

/**
 * Create Razorpay order on the backend
 * @param {object} orderData - { shippingAddressId, billingAddressId, customerNote, couponCode }
 * @returns {Promise}
 */
export const createRazorpayOrder = async (orderData) => {
    try {
        const response = await axiosInstance.post(
            `${RAZORPAY_PREFIX}/create-order`,
            orderData,
        );
        logger.info("Razorpay order created", {
            razorpayOrderId: response.data?.data?.razorpayOrderId,
        });
        return response;
    } catch (error) {
        logger.error("Failed to create Razorpay order:", error);
        throw error;
    }
};

/**
 * Verify Razorpay payment after checkout modal success
 * @param {object} paymentData - { razorpayOrderId, razorpayPaymentId, razorpaySignature }
 * @returns {Promise}
 */
export const verifyRazorpayPayment = async (paymentData) => {
    try {
        const response = await axiosInstance.post(
            `${RAZORPAY_PREFIX}/verify-payment`,
            paymentData,
        );
        logger.info("Razorpay payment verified");
        return response;
    } catch (error) {
        logger.error("Failed to verify Razorpay payment:", error);
        throw error;
    }
};
