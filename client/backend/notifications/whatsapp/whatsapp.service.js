import logger from "../../shared/utils/logger.util.js";
import {
    WHATSAPP_ENABLED,
    MSG91_WHATSAPP_URL,
    msg91Post,
    formatPhone,
    isChannelActive,
} from "../msg91.config.js";

// ============================================================================
// MSG91 WHATSAPP SERVICE
// ============================================================================
//
// All functions are best-effort — they log errors but never throw.
//
// HOW MSG91 WHATSAPP WORKS:
//   1. Register a WhatsApp Business number in MSG91 dashboard → WhatsApp.
//   2. Create message templates (submitted to Meta for approval — takes ~24hrs).
//   3. Note the exact template name (case-sensitive) and its parameter count.
//   4. Fill in TEMPLATE_NAMES and TEMPLATE_LANGUAGES below.
//   5. Set MSG91_WHATSAPP_NUMBER in .env to your registered number.
//
// TEMPLATE COMPONENTS:
//   - "header"  : optional — image/document/video or text header
//   - "body"    : main message text with {{1}}, {{2}} … positional params
//   - "buttons" : optional quick-reply / call-to-action buttons
//
// REQUIRED ENV VARS:
//   MSG91_WHATSAPP_NUMBER  — your WhatsApp Business number (e.g. 919876543210)
//
// FILL IN template names once approved by Meta:
// ============================================================================

const TEMPLATE_NAMES = {
    otp: "", // OTP template — Meta requires specific format
    orderConfirmation: "", // order placed
    paymentConfirmation: "", // Razorpay payment captured
    paymentFailed: "", // payment failed
    orderShipped: "", // dispatched with tracking
    orderDelivered: "", // delivered
    orderCancelled: "", // cancelled
};

// Language code for all templates (change if you create regional templates)
const LANG_CODE = "en";

// ── Internal helper ───────────────────────────────────────────────────────────

/**
 * Build a body component array from an ordered list of parameter values.
 *
 * MSG91 WhatsApp body params are positional: {{1}}, {{2}}, …
 * Each element in `params` maps to the corresponding {{n}} placeholder.
 *
 * @param {string[]} params
 */
const bodyParams = (params) => ({
    type: "body",
    parameters: params.map((text) => ({ type: "text", text: String(text) })),
});

/**
 * Send a WhatsApp template message via MSG91.
 *
 * @param {string}   templateName
 * @param {string}   phone         - raw phone number
 * @param {Array}    components    - WhatsApp template component objects
 * @param {string}   callerName
 * @param {boolean}  [throws]      - propagate errors (used for OTP)
 */
const sendWhatsapp = async (
    templateName,
    phone,
    components,
    callerName,
    throws = false,
) => {
    if (!isChannelActive("whatsapp", WHATSAPP_ENABLED, callerName)) return null;

    if (!templateName) {
        logger.warn(
            `[whatsapp] ${callerName}: template name not configured — skipping`,
        );
        return null;
    }

    const integratedNumber = process.env.MSG91_WHATSAPP_NUMBER;
    if (!integratedNumber) {
        logger.warn(
            `[whatsapp] ${callerName}: MSG91_WHATSAPP_NUMBER not set — skipping`,
        );
        return null;
    }

    try {
        const payload = {
            integrated_number: integratedNumber,
            content_type: "template",
            payload: [
                {
                    to: formatPhone(phone),
                    type: "template",
                    template: {
                        name: templateName,
                        language: { code: LANG_CODE },
                        components,
                    },
                },
            ],
        };

        const result = await msg91Post(MSG91_WHATSAPP_URL, payload);
        logger.info(`[whatsapp] ${callerName} sent to ${phone}`);
        return result;
    } catch (err) {
        logger.error(
            `[whatsapp] ${callerName} failed for ${phone}: ${err.message}`,
        );
        if (throws) throw err;
        return null;
    }
};

// ============================================================================
// USE CASES
// ============================================================================

/**
 * Send a login / verification OTP via WhatsApp.
 * THROWS on failure so the auth flow can surface the error.
 *
 * Meta requires OTP templates to use their standard format:
 *   "{{1}} is your OTP for Sana Silver. Do not share it with anyone."
 *   (Meta auto-appends the security advisory line.)
 *
 * @param {string} phone
 * @param {string} otp
 * @returns {Promise<object>} MSG91 response
 */
export const sendOtpWhatsapp = (phone, otp) => {
    return sendWhatsapp(
        TEMPLATE_NAMES.otp,
        phone,
        [bodyParams([otp])],
        "sendOtpWhatsapp",
        true,
    );
};

/**
 * Order placed confirmation.
 *
 * Suggested template body:
 *   "Hi {{1}}! 🎉 Your Sana Silver order *{{2}}* has been placed successfully.
 *    Total: *{{3}}* | {{4}} items. We'll notify you once it ships!"
 *
 * @param {string} phone
 * @param {object} data - { customerName, orderNumber, total, itemCount }
 */
export const sendOrderConfirmationWhatsapp = (
    phone,
    { customerName, orderNumber, total, itemCount },
) => {
    return sendWhatsapp(
        TEMPLATE_NAMES.orderConfirmation,
        phone,
        [bodyParams([customerName, orderNumber, `Rs.${total}`, itemCount])],
        "sendOrderConfirmationWhatsapp",
    );
};

/**
 * Razorpay payment captured successfully.
 *
 * Suggested template body:
 *   "Hi {{1}}! ✅ Payment of *{{2}}* received for order *{{3}}*.
 *    Thank you for shopping with Sana Silver."
 *
 * @param {string} phone
 * @param {object} data - { customerName, amount, orderNumber }
 */
export const sendPaymentConfirmationWhatsapp = (
    phone,
    { customerName, amount, orderNumber },
) => {
    return sendWhatsapp(
        TEMPLATE_NAMES.paymentConfirmation,
        phone,
        [bodyParams([customerName, `Rs.${amount}`, orderNumber])],
        "sendPaymentConfirmationWhatsapp",
    );
};

/**
 * Razorpay payment failed.
 *
 * Suggested template body:
 *   "Hi {{1}}, your payment for order *{{2}}* could not be processed.
 *    Please retry or contact us for help."
 *
 * @param {string} phone
 * @param {object} data - { customerName, orderNumber }
 */
export const sendPaymentFailedWhatsapp = (
    phone,
    { customerName, orderNumber },
) => {
    return sendWhatsapp(
        TEMPLATE_NAMES.paymentFailed,
        phone,
        [bodyParams([customerName, orderNumber])],
        "sendPaymentFailedWhatsapp",
    );
};

/**
 * Order dispatched — include courier and tracking link.
 *
 * Suggested template body:
 *   "Hi {{1}}! 🚚 Your order *{{2}}* has been shipped via *{{3}}*.
 *    Tracking ID: {{4}}
 *    Track here: {{5}}"
 *
 * @param {string} phone
 * @param {object} data - { customerName, orderNumber, courierName,
 *                          trackingId, trackingUrl }
 */
export const sendOrderShippedWhatsapp = (
    phone,
    { customerName, orderNumber, courierName, trackingId, trackingUrl },
) => {
    return sendWhatsapp(
        TEMPLATE_NAMES.orderShipped,
        phone,
        [
            bodyParams([
                customerName,
                orderNumber,
                courierName,
                trackingId,
                trackingUrl || "—",
            ]),
        ],
        "sendOrderShippedWhatsapp",
    );
};

/**
 * Order delivered.
 *
 * Suggested template body:
 *   "Hi {{1}}! ✨ Your Sana Silver order *{{2}}* has been delivered.
 *    We hope you love it! Leave a review to help others."
 *
 * @param {string} phone
 * @param {object} data - { customerName, orderNumber }
 */
export const sendOrderDeliveredWhatsapp = (
    phone,
    { customerName, orderNumber },
) => {
    return sendWhatsapp(
        TEMPLATE_NAMES.orderDelivered,
        phone,
        [bodyParams([customerName, orderNumber])],
        "sendOrderDeliveredWhatsapp",
    );
};

/**
 * Order cancelled.
 *
 * Suggested template body:
 *   "Hi {{1}}, your order *{{2}}* has been cancelled.
 *    Reason: {{3}}. Reach out to us if you need help."
 *
 * @param {string} phone
 * @param {object} data - { customerName, orderNumber, reason }
 */
export const sendOrderCancelledWhatsapp = (
    phone,
    { customerName, orderNumber, reason },
) => {
    return sendWhatsapp(
        TEMPLATE_NAMES.orderCancelled,
        phone,
        [
            bodyParams([
                customerName,
                orderNumber,
                reason || "Cancelled on request",
            ]),
        ],
        "sendOrderCancelledWhatsapp",
    );
};
