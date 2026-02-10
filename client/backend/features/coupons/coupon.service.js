import Coupon from "./coupon.model.js";
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
    if (coupon.hasUserExceededLimit(userId)) {
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
 */
const incrementCouponUsage = async (couponCode, userId) => {
    const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
    });

    if (!coupon) {
        throw new Error("Coupon not found");
    }

    // Increment overall usage count
    coupon.usageCount += 1;

    // Update user-specific usage tracking
    const userUsageIndex = coupon.usedBy.findIndex(
        (usage) => usage.user.toString() === userId.toString(),
    );

    if (userUsageIndex === -1) {
        // First time user is using this coupon
        coupon.usedBy.push({
            user: userId,
            usedCount: 1,
            lastUsedAt: new Date(),
        });
    } else {
        // User has used this coupon before
        coupon.usedBy[userUsageIndex].usedCount += 1;
        coupon.usedBy[userUsageIndex].lastUsedAt = new Date();
    }

    await coupon.save();
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

    // Get user's cart with populated product details
    const cart = await Cart.findOne({ userId })
        .populate({
            path: "items.productId",
            select: "name category",
        })
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

    // Check applicability for each coupon
    const couponsWithStatus = coupons.map((coupon) => {
        const eligibleItems = checkItemsEligibilityForCoupon(
            cart.items,
            coupon,
        );

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
            return (
                product.category &&
                coupon.applicableCategories.some(
                    (catId) => catId.toString() === product.category.toString(),
                )
            );
        }

        // If no restrictions, all items are eligible
        return true;
    });
};

/**
 * Get coupon by code (for admin or validation)
 */
const getCouponByCode = async (couponCode) => {
    return await Coupon.findOne({
        code: couponCode.toUpperCase(),
    });
};

/**
 * Create a new coupon (admin only)
 */
const createCoupon = async (couponData) => {
    const coupon = new Coupon(couponData);
    await coupon.save();
    return coupon;
};

/**
 * Update an existing coupon (admin only)
 */
const updateCoupon = async (couponId, updates) => {
    const coupon = await Coupon.findByIdAndUpdate(couponId, updates, {
        new: true,
        runValidators: true,
    });

    if (!coupon) {
        throw new Error("Coupon not found");
    }

    return coupon;
};

/**
 * Delete a coupon (admin only)
 */
const deleteCoupon = async (couponId) => {
    const coupon = await Coupon.findByIdAndDelete(couponId);

    if (!coupon) {
        throw new Error("Coupon not found");
    }

    return coupon;
};

/**
 * Get all coupons with optional filters (admin only)
 */
const getAllCoupons = async (filters = {}) => {
    const query = {};

    if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
    }

    if (filters.discountType) {
        query.discountType = filters.discountType;
    }

    const coupons = await Coupon.find(query)
        .populate("applicableCategories", "name")
        .populate("applicableProducts", "productName")
        .populate("applicableUsers", "name email")
        .sort({ createdAt: -1 });

    return coupons;
};

/**
 * Get coupon usage statistics (admin only)
 */
const getCouponStats = async (couponId) => {
    const coupon = await Coupon.findById(couponId).populate(
        "usedBy.user",
        "name email",
    );

    if (!coupon) {
        throw new Error("Coupon not found");
    }

    const totalRevenue = await Order.aggregate([
        { $match: { "appliedCoupon.code": coupon.code } },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: "$totalAmount" },
                totalDiscount: { $sum: "$appliedCoupon.discountAmount" },
            },
        },
    ]);

    return {
        coupon,
        stats: totalRevenue[0] || {
            totalOrders: 0,
            totalRevenue: 0,
            totalDiscount: 0,
        },
    };
};

export {
    // Validation & Usage
    validateCoupon,
    incrementCouponUsage,
    getAvailableCoupons,
    getAvailableCouponsWithCart,
    getCouponByCode,

    // Admin
    createCoupon,
    updateCoupon,
    deleteCoupon,
    getAllCoupons,
    getCouponStats,
};
