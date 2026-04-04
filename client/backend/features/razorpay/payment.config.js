import Razorpay from "razorpay";

// ============================================================================
// RAZORPAY TOGGLE
// ============================================================================
//
// Set RAZORPAY_ENABLED to false to completely disable Razorpay.
// When false:
//   - All Razorpay API routes return 503 "Payment gateway is currently unavailable"
//   - The Razorpay option will be hidden on the frontend (via /api/config/payment)
//
// ============================================================================

export const RAZORPAY_ENABLED = false;

// ============================================================================
// RAZORPAY CLIENT INSTANCE
// ============================================================================

let razorpayInstance = null;

export const getRazorpayInstance = () => {
    if (!RAZORPAY_ENABLED) {
        throw new Error("Razorpay is currently disabled");
    }

    if (!razorpayInstance) {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error(
                "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables",
            );
        }

        razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }

    return razorpayInstance;
};

// ============================================================================
// PAYMENT CONSTANTS
// ============================================================================

export const RAZORPAY_CURRENCY = "INR";

// Minimum order value (in rupees) to allow Razorpay
export const RAZORPAY_MIN_ORDER_VALUE = 1;
