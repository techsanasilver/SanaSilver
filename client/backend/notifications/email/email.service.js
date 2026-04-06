import logger from "../../shared/utils/logger.util.js";
import {
    EMAIL_ENABLED,
    MSG91_EMAIL_URL,
    msg91Post,
    isChannelActive,
} from "../msg91.config.js";

// ============================================================================
// MSG91 EMAIL SERVICE
// ============================================================================
//
// All functions are best-effort wrappers — they log failures but never throw,
// so a failed notification can never break an order flow.
//
// HOW MSG91 EMAIL WORKS:
//   1. Create a template in MSG91 dashboard → Email → Templates.
//   2. Add {{variable_name}} placeholders in the template body.
//   3. Copy the template ID and paste it in the TEMPLATE_IDS map below.
//   4. Pass matching key-value pairs in the `variables` field.
//
// REQUIRED ENV VARS:
//   MSG91_FROM_EMAIL   — verified sender address  (e.g. noreply@sanasilver.com)
//   MSG91_FROM_NAME    — display name             (e.g. Sana Silver)
//
// FILL IN template IDs once created on the MSG91 dashboard:
// ============================================================================

const TEMPLATE_IDS = {
    orderConfirmation: "", // e.g. "6703abc1d8f3e200193a1234"
    paymentConfirmation: "", // payment captured via Razorpay
    paymentFailed: "", // Razorpay payment failed
    orderShipped: "", // order dispatched with courier details
    orderDelivered: "", // order marked delivered
    orderCancelled: "", // order cancelled
    refundInitiated: "", // refund raised
    welcome: "", // new user registration
};

// ── Internal helper ───────────────────────────────────────────────────────────

/**
 * Send an email via MSG91.
 *
 * @param {string}   templateId
 * @param {object}   to           - { name: string, email: string }
 * @param {object}   variables    - key/value pairs matching template placeholders
 * @param {string}   callerName   - function name, used in log messages
 */
const sendEmail = async (templateId, to, variables, callerName) => {
    if (!isChannelActive("email", EMAIL_ENABLED, callerName)) return null;

    if (!templateId) {
        logger.warn(
            `[email] ${callerName}: template ID not configured — skipping`,
        );
        return null;
    }

    try {
        const payload = {
            template_id: templateId,
            from: {
                name: process.env.MSG91_FROM_NAME || "Sana Silver",
                email: process.env.MSG91_FROM_EMAIL,
            },
            to: [{ name: to.name, email: to.email }],
            variables,
        };

        const result = await msg91Post(MSG91_EMAIL_URL, payload);
        logger.info(`[email] ${callerName} sent to ${to.email}`);
        return result;
    } catch (err) {
        logger.error(
            `[email] ${callerName} failed for ${to.email}: ${err.message}`,
        );
        return null;
    }
};

// ============================================================================
// USE CASES
// ============================================================================

/**
 * Order placed confirmation — sent immediately after an order is created.
 * Covers both COD and Razorpay (Razorpay sends this after payment verification).
 *
 * @param {object} user  - { name, email }
 * @param {object} order - { orderNumber, items[], pricing, payment.method,
 *                          shippingAddress, createdAt }
 */
export const sendOrderConfirmationEmail = (user, order) => {
    const variables = {
        customer_name: user.name,
        order_number: order.orderNumber,
        payment_method:
            order.payment.method === "cod"
                ? "Cash on Delivery"
                : "Online Payment",
        item_count: order.items.length,
        order_total: `₹${order.pricing.total}`,
        shipping_name: order.shippingAddress.name,
        shipping_address: [
            order.shippingAddress.line1,
            order.shippingAddress.line2,
            order.shippingAddress.city,
            order.shippingAddress.state,
            order.shippingAddress.pincode,
        ]
            .filter(Boolean)
            .join(", "),
    };

    return sendEmail(
        TEMPLATE_IDS.orderConfirmation,
        { name: user.name, email: user.email },
        variables,
        "sendOrderConfirmationEmail",
    );
};

/**
 * Payment captured via Razorpay.
 * Send after verifyAndConfirmPayment succeeds.
 *
 * @param {object} user  - { name, email }
 * @param {object} order - { orderNumber, pricing, payment.razorpayPaymentId, payment.paidAt }
 */
export const sendPaymentConfirmationEmail = (user, order) => {
    const variables = {
        customer_name: user.name,
        order_number: order.orderNumber,
        amount_paid: `₹${order.pricing.total}`,
        payment_id: order.payment.razorpayPaymentId,
        paid_at: new Date(order.payment.paidAt).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        }),
    };

    return sendEmail(
        TEMPLATE_IDS.paymentConfirmation,
        { name: user.name, email: user.email },
        variables,
        "sendPaymentConfirmationEmail",
    );
};

/**
 * Razorpay payment failed.
 * Send when the payment.failed webhook fires.
 *
 * @param {object} user  - { name, email }
 * @param {object} order - { orderNumber, pricing }
 */
export const sendPaymentFailedEmail = (user, order) => {
    const variables = {
        customer_name: user.name,
        order_number: order.orderNumber,
        order_total: `₹${order.pricing.total}`,
    };

    return sendEmail(
        TEMPLATE_IDS.paymentFailed,
        { name: user.name, email: user.email },
        variables,
        "sendPaymentFailedEmail",
    );
};

/**
 * Order dispatched — include courier and tracking details.
 *
 * @param {object} user         - { name, email }
 * @param {object} order        - { orderNumber }
 * @param {object} trackingInfo - { courierName, trackingId, trackingUrl }
 */
export const sendOrderShippedEmail = (user, order, trackingInfo) => {
    const variables = {
        customer_name: user.name,
        order_number: order.orderNumber,
        courier_name: trackingInfo.courierName,
        tracking_id: trackingInfo.trackingId,
        tracking_url: trackingInfo.trackingUrl || "—",
    };

    return sendEmail(
        TEMPLATE_IDS.orderShipped,
        { name: user.name, email: user.email },
        variables,
        "sendOrderShippedEmail",
    );
};

/**
 * Order delivered successfully.
 *
 * @param {object} user  - { name, email }
 * @param {object} order - { orderNumber }
 */
export const sendOrderDeliveredEmail = (user, order) => {
    const variables = {
        customer_name: user.name,
        order_number: order.orderNumber,
    };

    return sendEmail(
        TEMPLATE_IDS.orderDelivered,
        { name: user.name, email: user.email },
        variables,
        "sendOrderDeliveredEmail",
    );
};

/**
 * Order cancelled.
 *
 * @param {object} user  - { name, email }
 * @param {object} order - { orderNumber, pricing }
 * @param {string} [reason] - optional cancellation reason
 */
export const sendOrderCancelledEmail = (user, order, reason) => {
    const variables = {
        customer_name: user.name,
        order_number: order.orderNumber,
        order_total: `₹${order.pricing.total}`,
        cancellation_reason: reason || "Cancelled on request",
    };

    return sendEmail(
        TEMPLATE_IDS.orderCancelled,
        { name: user.name, email: user.email },
        variables,
        "sendOrderCancelledEmail",
    );
};

/**
 * Refund has been initiated.
 *
 * @param {object} user         - { name, email }
 * @param {object} order        - { orderNumber }
 * @param {number} refundAmount - amount in rupees
 */
export const sendRefundInitiatedEmail = (user, order, refundAmount) => {
    const variables = {
        customer_name: user.name,
        order_number: order.orderNumber,
        refund_amount: `₹${refundAmount}`,
    };

    return sendEmail(
        TEMPLATE_IDS.refundInitiated,
        { name: user.name, email: user.email },
        variables,
        "sendRefundInitiatedEmail",
    );
};

/**
 * Welcome email after a new account is created.
 *
 * @param {object} user - { name, email }
 */
export const sendWelcomeEmail = (user) => {
    const variables = {
        customer_name: user.name,
    };

    return sendEmail(
        TEMPLATE_IDS.welcome,
        { name: user.name, email: user.email },
        variables,
        "sendWelcomeEmail",
    );
};
