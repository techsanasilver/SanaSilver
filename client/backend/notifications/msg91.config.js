import logger from "../shared/utils/logger.util.js";

// ============================================================================
// MSG91 CONFIGURATION
// ============================================================================
//
// MSG91 is used for all transactional notifications across three channels:
//   - Email
//   - SMS
//   - WhatsApp
//
// MASTER TOGGLE
//   Set NOTIFICATIONS_ENABLED = false to silence all notifications globally
//   (useful during development, data migrations, or maintenance windows).
//
// CHANNEL TOGGLES
//   Each channel can also be disabled independently.
//
// ENV VARS REQUIRED:
//   MSG91_AUTH_KEY         — from MSG91 dashboard → API Keys
//   MSG91_SENDER_ID        — 6-char SMS sender ID approved by MSG91 (e.g. SNSLVR)
//   MSG91_WHATSAPP_NUMBER  — your registered WhatsApp Business number with country
//                            code, no + or spaces  (e.g. 919876543210)
//   MSG91_FROM_EMAIL       — verified sender email address (e.g. noreply@sanasilver.com)
//   MSG91_FROM_NAME        — sender display name shown in inbox (e.g. Sana Silver)
//
// ============================================================================

// ── Master toggle ────────────────────────────────────────────────────────────
export const NOTIFICATIONS_ENABLED = true;

// ── Per-channel toggles ───────────────────────────────────────────────────────
export const EMAIL_ENABLED = true;
export const SMS_ENABLED = true;
export const WHATSAPP_ENABLED = true;

// ── MSG91 API base URLs ───────────────────────────────────────────────────────
export const MSG91_SMS_URL = "https://api.msg91.com/api/v5/flow/";
export const MSG91_EMAIL_URL = "https://api.msg91.com/api/v5/email/send";
export const MSG91_WHATSAPP_URL =
    "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/";

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Normalise an Indian mobile number to the MSG91 format: 91XXXXXXXXXX
 *
 * Accepts any of:
 *   9876543210       → 919876543210
 *   +919876543210    → 919876543210
 *   919876543210     → 919876543210 (already correct)
 */
export const formatPhone = (phone) => {
    const digits = String(phone).replace(/\D/g, "");
    if (digits.startsWith("91") && digits.length === 12) return digits;
    if (digits.length === 10) return `91${digits}`;
    // Already has country code but length is unexpected — return as-is and let
    // MSG91 validate it
    return digits;
};

/**
 * Central HTTP helper for all MSG91 API calls.
 * Uses native Node 18+ fetch.
 *
 * @param {string} url      - Full MSG91 endpoint URL
 * @param {object} body     - JSON payload
 * @returns {Promise<object>} Parsed JSON response from MSG91
 * @throws {Error} On network failure or non-2xx response
 */
export const msg91Post = async (url, body) => {
    const authKey = process.env.MSG91_AUTH_KEY;

    if (!authKey) {
        throw new Error("MSG91_AUTH_KEY is not set in environment variables");
    }

    const response = await fetch(url, {
        method: "POST",
        headers: {
            authkey: authKey,
            "Content-Type": "application/json",
            accept: "application/json",
        },
        body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
        const message = data?.message || data?.error || response.statusText;
        throw new Error(`MSG91 API error (${response.status}): ${message}`);
    }

    return data;
};

/**
 * Guard used at the top of every notification function.
 * Returns true if the channel is active and should send, false otherwise.
 *
 * @param {string} channel - "email" | "sms" | "whatsapp"
 * @param {boolean} channelEnabled - the per-channel flag
 * @param {string} fnName - caller function name for logging
 */
export const isChannelActive = (channel, channelEnabled, fnName) => {
    if (!NOTIFICATIONS_ENABLED) {
        logger.debug(
            `[notifications] Skipped ${fnName} — notifications disabled globally`,
        );
        return false;
    }
    if (!channelEnabled) {
        logger.debug(
            `[notifications] Skipped ${fnName} — ${channel} channel disabled`,
        );
        return false;
    }
    return true;
};
