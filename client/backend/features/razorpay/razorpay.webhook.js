import * as razorpayService from "./razorpay.service.js";
import logger from "../../shared/utils/logger.util.js";
import { RAZORPAY_ENABLED } from "./payment.config.js";

// ============================================================================
// RAZORPAY WEBHOOK HANDLER (MIDDLEWARE)
// ============================================================================
//
// IMPORTANT: This route MUST be mounted using express.raw({ type: "application/json" })
// middleware BEFORE express.json() is applied.
// The raw request body (Buffer) is required for HMAC signature verification.
//
// Mounted in server.js as:
//   app.post("/api/razorpay/webhook",
//     express.raw({ type: "application/json" }),
//     razorpayWebhookHandler
//   );
//
// Events handled:
//   - payment.captured  → confirm order (safety net if browser tab was closed)
//   - payment.failed    → cancel order + restore stock
//   - refund.created    → mark payment as refunded
//
// ============================================================================

const razorpayWebhookHandler = async (req, res) => {
    // Always respond 200 quickly — Razorpay retries on non-2xx
    res.status(200).json({ received: true });

    if (!RAZORPAY_ENABLED) {
        logger.warn(
            "Razorpay webhook received but Razorpay is disabled — ignoring",
        );
        return;
    }

    const signature = req.headers["x-razorpay-signature"];

    if (!signature) {
        logger.warn(
            "Razorpay webhook received without x-razorpay-signature header",
        );
        return;
    }

    try {
        // req.body is a Buffer when using express.raw()
        await razorpayService.handleWebhookEvent(req.body, signature);
    } catch (error) {
        // Log but don't re-respond — we already sent 200
        logger.error(`Error processing Razorpay webhook: ${error.message}`);
    }
};

export default razorpayWebhookHandler;
