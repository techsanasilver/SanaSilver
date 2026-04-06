import logger from "../../shared/utils/logger.util.js";
import {
    SMS_ENABLED,
    MSG91_SMS_URL,
    msg91Post,
    formatPhone,
    isChannelActive,
} from "../msg91.config.js";

// ============================================================================
// MSG91 SMS SERVICE
// ============================================================================
//
// Transactional functions are best-effort — they log errors and return null,
// never throwing, so failures cannot disrupt order flows.
//
// OTP functions are the exception: they return the full MSG91 response and
// propagate errors so the caller can decide how to handle OTP send failures.
//
// HOW MSG91 SMS FLOW WORKS:
//   1. Create a template in MSG91 dashboard → SMS → Templates (DLT registered).
//   2. Note the {{#var#}} variables in the template — they map positionally
//      to var1, var2, var3 … in the payload.
//   3. Paste the template_id in TEMPLATE_IDS below.
//   4. Ensure your MSG91_SENDER_ID matches the DLT approved sender.
//
// REQUIRED ENV VARS:
//   MSG91_SENDER_ID    — 6-char DLT-approved sender ID  (e.g. SNSLVR)
//
// FILL IN template IDs once created on the MSG91 dashboard:
// ============================================================================

const TEMPLATE_IDS = {
    otp: "", // OTP for login / verification
    orderConfirmation: "", // order placed successfully
    paymentConfirmation: "", // Razorpay payment captured
    orderShipped: "", // order dispatched with tracking
    orderDelivered: "", // order delivered
    orderCancelled: "", // order cancelled
};

// ── Internal helper ───────────────────────────────────────────────────────────

/**
 * Send an SMS via MSG91 Flow (template-based).
 *
 * @param {string}   templateId
 * @param {string}   phone      - raw phone number (formatted internally)
 * @param {object}   vars       - { var1, var2, ... } matching template placeholders
 * @param {string}   callerName - function name for log messages
 * @param {boolean}  [throws]   - if true, propagates errors (used for OTP)
 */
const sendSms = async (templateId, phone, vars, callerName, throws = false) => {
    if (!isChannelActive("sms", SMS_ENABLED, callerName)) return null;

    if (!templateId) {
        logger.warn(
            `[sms] ${callerName}: template ID not configured — skipping`,
        );
        return null;
    }

    try {
        const payload = {
            template_id: templateId,
            short_url: "0",
            realTimeResponse: "1",
            recipients: [
                {
                    mobiles: formatPhone(phone),
                    ...vars,
                },
            ],
        };

        const result = await msg91Post(MSG91_SMS_URL, payload);
        logger.info(`[sms] ${callerName} sent to ${phone}`);
        return result;
    } catch (err) {
        logger.error(`[sms] ${callerName} failed for ${phone}: ${err.message}`);
        if (throws) throw err;
        return null;
    }
};

// ============================================================================
// USE CASES
// ============================================================================

/**
 * Send a login / verification OTP via SMS.
 * Unlike other functions, this THROWS on failure so the caller can block
 * the auth flow and surface the error to the user.
 *
 * Template example:
 *   "Your Sana Silver OTP is {{#var1#}}. Valid for {{#var2#}} minutes."
 *
 * @param {string} phone          - customer mobile number
 * @param {string} otp            - the OTP string
 * @param {number} [expiryMinutes=10]
 * @returns {Promise<object>}     MSG91 response
 */
export const sendOtpSms = (phone, otp, expiryMinutes = 10) => {
    return sendSms(
        TEMPLATE_IDS.otp,
        phone,
        { var1: otp, var2: String(expiryMinutes) },
        "sendOtpSms",
        true, // throws on failure
    );
};

/**
 * Order placed confirmation.
 * Send right after the order document is saved (COD) or payment is
 * verified (Razorpay).
 *
 * Template example:
 *   "Hi {{#var1#}}, your Sana Silver order {{#var2#}} for {{#var3#}} has been placed!"
 *
 * @param {string} phone
 * @param {object} data - { customerName, orderNumber, total }
 */
export const sendOrderConfirmationSms = (
    phone,
    { customerName, orderNumber, total },
) => {
    return sendSms(
        TEMPLATE_IDS.orderConfirmation,
        phone,
        { var1: customerName, var2: orderNumber, var3: `Rs.${total}` },
        "sendOrderConfirmationSms",
    );
};

/**
 * Payment captured via Razorpay.
 * Send after verifyAndConfirmPayment succeeds.
 *
 * Template example:
 *   "Payment of {{#var1#}} received for order {{#var2#}}. Thank you - Sana Silver"
 *
 * @param {string} phone
 * @param {object} data - { amount, orderNumber }
 */
export const sendPaymentConfirmationSms = (phone, { amount, orderNumber }) => {
    return sendSms(
        TEMPLATE_IDS.paymentConfirmation,
        phone,
        { var1: `Rs.${amount}`, var2: orderNumber },
        "sendPaymentConfirmationSms",
    );
};

/**
 * Order dispatched — include courier and tracking ID.
 *
 * Template example:
 *   "Your order {{#var1#}} has been shipped via {{#var2#}}. Track: {{#var3#}}"
 *
 * @param {string} phone
 * @param {object} data - { orderNumber, courierName, trackingId }
 */
export const sendOrderShippedSms = (
    phone,
    { orderNumber, courierName, trackingId },
) => {
    return sendSms(
        TEMPLATE_IDS.orderShipped,
        phone,
        { var1: orderNumber, var2: courierName, var3: trackingId },
        "sendOrderShippedSms",
    );
};

/**
 * Order delivered successfully.
 *
 * Template example:
 *   "Your Sana Silver order {{#var1#}} has been delivered. Enjoy your jewellery!"
 *
 * @param {string} phone
 * @param {object} data - { orderNumber }
 */
export const sendOrderDeliveredSms = (phone, { orderNumber }) => {
    return sendSms(
        TEMPLATE_IDS.orderDelivered,
        phone,
        { var1: orderNumber },
        "sendOrderDeliveredSms",
    );
};

/**
 * Order cancelled.
 *
 * Template example:
 *   "Your Sana Silver order {{#var1#}} has been cancelled. Contact us for help."
 *
 * @param {string} phone
 * @param {object} data - { orderNumber }
 */
export const sendOrderCancelledSms = (phone, { orderNumber }) => {
    return sendSms(
        TEMPLATE_IDS.orderCancelled,
        phone,
        { var1: orderNumber },
        "sendOrderCancelledSms",
    );
};
