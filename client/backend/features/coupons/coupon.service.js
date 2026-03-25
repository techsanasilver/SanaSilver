import Coupon from "./coupon.model.js";
import CouponUsage from "./coupon-usage.model.js";
import Order from "../orders/order.model.js";
import Cart from "../cart/cart.model.js";

/**
 * Validate if a coupon can be used by a user
 * This validates COUPON-LEVEL rules only (existence, dates, limits, user eligibility)
 * Cart-level validation (eligible items) is done in checkout service
 */
const validateCoupon = async (couponCode, userId, orderValue) => {
    // Find coupon
    const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
    });

    if (!coupon) {
        return {
            valid: false,
            error: "Invalid coupon code",
        };
    }

    // Check if coupon is active
    if (!coupon.isActive) {
        return {
            valid: false,
            error: "This coupon is no longer active",
        };
    }

    // Check validity period
    const now = new Date();
    if (coupon.validFrom > now) {
        return {
            valid: false,
            error: `This coupon will be valid from ${coupon.validFrom.toDateString()}`,
        };
    }

    if (coupon.validTo < now) {
        return {
            valid: false,
            error: "This coupon has expired",
        };
    }

    // Check overall usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return {
            valid: false,
            error: "This coupon has reached its usage limit",
        };
    }

    // Check per-user limit
    const hasExceededLimit = await CouponUsage.hasUserExceededLimit(
        coupon._id,
        userId,
        coupon.perUserLimit,
    );
    if (hasExceededLimit) {
        return {
            valid: false,
            error: "You have already used this coupon the maximum number of times",
        };
    }

    // Check minimum order value
    if (coupon.minOrderValue && orderValue < coupon.minOrderValue) {
        return {
            valid: false,
            error: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon`,
        };
    }

    // Check user-specific restrictions
    if (coupon.applicableUsers && coupon.applicableUsers.length > 0) {
        const isApplicableToUser = coupon.applicableUsers.some(
            (id) => id.toString() === userId.toString(),
        );
        if (!isApplicableToUser) {
            return {
                valid: false,
                error: "This coupon is not available for your account",
            };
        }
    }

    // Check first-time user restriction
    if (coupon.firstTimeUserOnly) {
        const hasOrders = await Order.exists({ customer: userId });
        if (hasOrders) {
            return {
                valid: false,
                error: "This coupon is only available for first-time customers",
            };
        }
    }

    // Coupon is valid
    return {
        valid: true,
        coupon,
    };
};

/**
 * Increment usage count for a coupon after successful order
 * Now records usage in separate CouponUsage collection
 */
const incrementCouponUsage = async (
    couponCode,
    userId,
    orderId,
    discountApplied,
    orderValue,
) => {
    const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
    });

    if (!coupon) {
        throw new Error("Coupon not found");
    }

    // Increment overall usage count
    coupon.usageCount += 1;
    await coupon.save();

    // Record usage in CouponUsage collection
    await CouponUsage.recordUsage({
        couponId: coupon._id,
        userId,
        orderId,
        discountApplied,
        orderValue,
    });

    return coupon;
};

/**
 * Get all active coupons available for a user
 */
const getAvailableCoupons = async (userId) => {
    return await Coupon.findAvailableForUser(userId);
};

/**
 * Get coupons with applicability status based on user's current cart
 * Returns coupons sorted: applicable first, then non-applicable
 */
const getAvailableCouponsWithCart = async (userId) => {
    // Get all available coupons
    const coupons = await Coupon.findAvailableForUser(userId);

    // Get user's cart with populated product and variant details
    const cart = await Cart.findOne({ userId })
        .populate({
            path: "items.productId",
            select: "name category subcategory",
        })
        .populate({ path: "items.variantId", select: "sellingPrice" })
        .lean();

    // If cart is empty, all coupons are marked as not applicable
    if (!cart || !cart.items || cart.items.length === 0) {
        return coupons.map((coupon) => ({
            ...coupon,
            isApplicable: false,
            applicabilityReason: "Cart is empty",
            eligibleItemsCount: 0,
        }));
    }

    // Calculate cart total using DB-authoritative prices
    const cartTotal = cart.items.reduce((sum, item) => {
        const price = item.variantId?.sellingPrice || 0;
        return sum + price * item.quantity;
    }, 0);

    // Check if user is a first-time customer (cached once for all coupons)
    const hasOrders = await Order.exists({ customer: userId });

    // Check applicability for each coupon
    const couponsWithStatus = coupons.map((coupon) => {
        // Check first-time user restriction
        if (coupon.firstTimeUserOnly && hasOrders) {
            return {
                ...coupon,
                isApplicable: false,
                applicabilityReason: "Only available for first-time customers",
                eligibleItemsCount: 0,
            };
        }

        // Filter eligible items first, then check minOrderValue against eligible total only.
        // This ensures restricted coupons check the right value (not bolstered by non-eligible items),
        // and uses GST-inclusive sellingPrice (what the customer sees) — not the pre-GST base.
        const eligibleItems = checkItemsEligibilityForCoupon(
            cart.items,
            coupon,
        );

        const eligibleSellingTotal = eligibleItems.reduce((sum, item) => {
            return sum + (item.variantId?.sellingPrice || 0) * item.quantity;
        }, 0);

        if (
            coupon.minOrderValue &&
            eligibleSellingTotal < coupon.minOrderValue
        ) {
            const remaining = Math.ceil(
                coupon.minOrderValue - eligibleSellingTotal,
            );
            return {
                ...coupon,
                isApplicable: false,
                applicabilityReason:
                    eligibleItems.length > 0
                        ? `Add ₹${remaining} more to use this coupon`
                        : `Minimum order value of ₹${coupon.minOrderValue} required`,
                eligibleItemsCount: eligibleItems.length,
            };
        }

        const isApplicable = eligibleItems.length > 0;

        let applicabilityReason = "";
        if (!isApplicable) {
            if (coupon.applicableProducts?.length > 0) {
                applicabilityReason =
                    "No items in cart match this coupon's product list";
            } else if (coupon.applicableCategories?.length > 0) {
                applicabilityReason =
                    "No items in cart match this coupon's categories";
            } else if (coupon.excludedProducts?.length > 0) {
                applicabilityReason =
                    "All cart items are excluded from this coupon";
            }
        }

        return {
            ...coupon,
            isApplicable,
            applicabilityReason,
            eligibleItemsCount: eligibleItems.length,
        };
    });

    // Sort: applicable coupons first, then non-applicable
    return couponsWithStatus.sort((a, b) => {
        if (a.isApplicable && !b.isApplicable) return -1;
        if (!a.isApplicable && b.isApplicable) return 1;
        return 0;
    });
};

/**
 * Check which cart items are eligible for a specific coupon
 * Similar to filterEligibleItems in checkout service
 */
const checkItemsEligibilityForCoupon = (cartItems, coupon) => {
    return cartItems.filter((cartItem) => {
        const product = cartItem.productId;
        if (!product) return false;

        const productId = product._id.toString();

        // Check if product is explicitly excluded
        if (
            coupon.excludedProducts &&
            coupon.excludedProducts.length > 0 &&
            coupon.excludedProducts.some((id) => id.toString() === productId)
        ) {
            return false;
        }

        // If specific products are listed, item must be in that list
        if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
            return coupon.applicableProducts.some(
                (id) => id.toString() === productId,
            );
        }

        // If specific categories are listed, item must be in one of those categories
        if (
            coupon.applicableCategories &&
            coupon.applicableCategories.length > 0
        ) {
            const productCategoryId = product.category?.toString();
            const productSubcategoryId = product.subcategory?.toString();
            return coupon.applicableCategories.some((catId) => {
                const catStr = catId.toString();
                return (
                    (productCategoryId && catStr === productCategoryId) ||
                    (productSubcategoryId && catStr === productSubcategoryId)
                );
            });
        }

        // If no restrictions, all items are eligible
        return true;
    });
};

/**
 * Get coupon by code (for validation)
 */
const getCouponByCode = async (couponCode) => {
    return await Coupon.findOne({
        code: couponCode.toUpperCase(),
    });
};

/**
 * Apply a coupon to the user's cart (preview only — does not record usage)
 * Uses DB-authoritative prices and eligible items filter
 */
const applyCouponToCart = async (couponCode, userId) => {
    // Fetch real cart with DB-authoritative prices
    const cart = await Cart.findOne({ userId })
        .populate({
            path: "items.productId",
            select: "name category subcategory",
        })
        .populate({ path: "items.variantId", select: "sellingPrice" })
        .lean();

    if (!cart || !cart.items || cart.items.length === 0) {
        return { valid: false, error: "Your cart is empty" };
    }

    // Smart minOrderValue: filter eligible items first, then check minOrderValue
    // against eligible items' GST-inclusive total only.
    // This ensures restricted coupons check only the products they apply to,
    // and the full-cart displayed price (GST-inclusive) is used — not the pre-GST base.
    const rawCoupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!rawCoupon) {
        return { valid: false, error: "Invalid coupon code" };
    }

    const eligibleItems = checkItemsEligibilityForCoupon(cart.items, rawCoupon);
    if (eligibleItems.length === 0) {
        return {
            valid: false,
            error: "No items in your cart are eligible for this coupon",
        };
    }

    // GST-inclusive eligible total — used for minOrderValue check
    const eligibleSubtotal = eligibleItems.reduce((sum, item) => {
        return sum + (item.variantId?.sellingPrice || 0) * item.quantity;
    }, 0);

    // Full validation: dates, usage limits, user restrictions + minOrderValue vs eligible total
    const validation = await validateCoupon(
        couponCode,
        userId,
        eligibleSubtotal,
    );
    if (!validation.valid) {
        return validation;
    }

    const { coupon } = validation;

    // GST-inclusive cart total (for response only)
    const cartTotal = cart.items.reduce((sum, item) => {
        return sum + (item.variantId?.sellingPrice || 0) * item.quantity;
    }, 0);

    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
        discountAmount = (eligibleSubtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount) {
            discountAmount = Math.min(discountAmount, coupon.maxDiscount);
        }
    } else if (coupon.discountType === "flat") {
        discountAmount = Math.min(coupon.discountValue, eligibleSubtotal);
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    return {
        valid: true,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        subtotal: Math.round(cartTotal * 100) / 100,
        finalAmount: Math.round((cartTotal - discountAmount) * 100) / 100,
    };
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
    // Customer Validation & Usage
    validateCoupon,
    incrementCouponUsage,
    getAvailableCoupons,
    getAvailableCouponsWithCart,
    applyCouponToCart,
    getCouponByCode,
};
