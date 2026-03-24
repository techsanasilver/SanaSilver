import axiosInstance from "../utils/axios";
import logger from "../utils/logger.util";

const API_PREFIX = "/checkout";

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
 * Create Razorpay order (placeholder - not yet implemented on backend)
 * @param {object} orderData - { shippingAddressId, billingAddressId, customerNote, couponCode }
 * @returns {Promise}
 */
export const createRazorpayOrder = async (orderData) => {
    try {
        const response = await axiosInstance.post(
            `${API_PREFIX}/create-razorpay-order`,
            orderData,
        );
        logger.info("Razorpay order created", {
            razorpayOrderId: response.data?.razorpayOrderId,
        });
        return response;
    } catch (error) {
        logger.error("Failed to create Razorpay order:", error);
        throw error;
    }
};

/**
 * Verify Razorpay payment (placeholder - not yet implemented on backend)
 * @param {object} paymentData - { razorpayOrderId, razorpayPaymentId, razorpaySignature }
 * @returns {Promise}
 */
export const verifyRazorpayPayment = async (paymentData) => {
    try {
        const response = await axiosInstance.post(
            `${API_PREFIX}/verify-razorpay-payment`,
            paymentData,
        );
        logger.info("Razorpay payment verified");
        return response;
    } catch (error) {
        logger.error("Failed to verify Razorpay payment:", error);
        throw error;
    }
};
