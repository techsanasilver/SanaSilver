import * as couponService from "./coupon.service.js";
import apiResponse from "../../shared/utils/response.util.js";
import logger from "../../shared/utils/logger.util.js";

/**
 * Get all available coupons for the authenticated user
 * Coupons are sorted: applicable to current cart first, then non-applicable
 * GET /api/coupons/available
 */
const getAvailableCoupons = async (req, res) => {
    try {
        const userId = req.user.userId;

        const coupons = await couponService.getAvailableCouponsWithCart(userId);

        // Remove sensitive fields before sending to client
        const sanitizedCoupons = coupons.map((coupon) => ({
            code: coupon.code,
            description: coupon.description,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            maxDiscount: coupon.maxDiscount,
            minOrderValue: coupon.minOrderValue,
            validFrom: coupon.validFrom,
            validTo: coupon.validTo,
            tags: coupon.tags,
            // Applicability status
            isApplicable: coupon.isApplicable,
            applicabilityReason: coupon.applicabilityReason,
            eligibleItemsCount: coupon.eligibleItemsCount,
        }));

        return apiResponse.success(
            res,
            "Available coupons retrieved successfully",
            sanitizedCoupons,
        );
    } catch (error) {
        logger.error("Error getting available coupons:", error);
        return apiResponse.serverError(
            res,
            "Failed to retrieve available coupons",
        );
    }
};

/**
 * Validate a coupon code without applying it
 * POST /api/coupons/validate
 * Body: { couponCode, orderValue }
 */
const validateCouponCode = async (req, res) => {
    try {
        const { couponCode, orderValue } = req.body;
        const userId = req.user.userId;

        if (!couponCode) {
            return apiResponse.badRequest(res, "Coupon code is required");
        }

        if (!orderValue || orderValue <= 0) {
            return apiResponse.badRequest(res, "Valid order value is required");
        }

        const validation = await couponService.validateCoupon(
            couponCode,
            userId,
            orderValue,
        );

        if (!validation.valid) {
            return apiResponse.badRequest(res, validation.error);
        }

        // Return coupon details (sanitized)
        const { coupon } = validation;
        return apiResponse.success(res, "Coupon validated successfully", {
            code: coupon.code,
            description: coupon.description,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            maxDiscount: coupon.maxDiscount,
            message: "Coupon is valid",
        });
    } catch (error) {
        logger.error("Error validating coupon:", error);
        return apiResponse.serverError(res, "Failed to validate coupon");
    }
};

/**
 * Apply a coupon to the cart (preview pricing)
 * POST /api/coupons/apply
 * Body: { couponCode }
 *
 * Fetches real cart prices from DB and filters eligible items server-side.
 * The checkout service re-validates independently before finalising the order.
 */
const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.user.userId;

        if (!couponCode) {
            return apiResponse.badRequest(res, "Coupon code is required");
        }

        const result = await couponService.applyCouponToCart(
            couponCode,
            userId,
        );

        if (!result.valid) {
            return apiResponse.badRequest(res, result.error);
        }

        return apiResponse.success(res, "Coupon applied successfully", {
            code: result.code,
            description: result.description,
            discountType: result.discountType,
            discountValue: result.discountValue,
            discountAmount: result.discountAmount,
            subtotal: result.subtotal,
            finalAmount: result.finalAmount,
        });
    } catch (error) {
        logger.error("Error applying coupon:", error);
        return apiResponse.serverError(res, "Failed to apply coupon");
    }
};

/**
 * Remove coupon from cart
 * POST /api/coupons/remove
 *
 * Note: This is a client-side operation mostly
 * This endpoint just returns success for consistency
 */
const removeCoupon = async (req, res) => {
    try {
        return apiResponse.success(res, "Coupon removed successfully", null);
    } catch (error) {
        logger.error("Error removing coupon:", error);
        return apiResponse.serverError(res, "Failed to remove coupon");
    }
};

export { getAvailableCoupons, validateCouponCode, applyCoupon, removeCoupon };
