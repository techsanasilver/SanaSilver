import axiosInstance from "../utils/axios";
import logger from "../utils/logger.util";

const API_PREFIX = "/client/checkout";

/**
 * Initiate checkout - validate cart and calculate pricing
 * @param {object} checkoutData - Checkout data (shippingAddressId, billingAddressId, paymentMethod, customerNote)
 * @returns {Promise}
 */
export const initiateCheckout = async (checkoutData) => {
    try {
        const response = await axiosInstance.post(
            `${API_PREFIX}/initiate`,
            checkoutData,
        );
        logger.info("Checkout initiated");
        return response;
    } catch (error) {
        logger.error("Checkout initiation failed:", error);
        throw error;
    }
};

/**
 * Place order with Cash on Delivery
 * @param {object} orderData - Order data (shippingAddressId, billingAddressId, customerNote)
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
