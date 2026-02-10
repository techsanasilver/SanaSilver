import Coupon from "./coupon.model.js";
import CouponUsage from "./coupon-usage.model.js";
import logger from "../../shared/utils/logger.util.js";
import Order from "../orders/order.model.js";

/**
 * Create a new coupon
 */
const createCoupon = async (couponData, adminId) => {
    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({
        code: couponData.code.toUpperCase(),
    });

    if (existingCoupon) {
        throw new Error("Coupon code already exists");
    }

    // Validate dates
    const validFrom = new Date(couponData.validFrom);
    const validTo = new Date(couponData.validTo);

    if (validTo <= validFrom) {
        throw new Error("Valid to date must be after valid from date");
    }

    // Create coupon
    const coupon = await Coupon.create({
        ...couponData,
        code: couponData.code.toUpperCase(),
        validFrom,
        validTo,
        createdBy: adminId,
    });

    logger.info(`Coupon created: ${coupon.code} by admin ${adminId}`);

    return coupon;
};

/**
 * Get all coupons with filters and pagination
 */
const getAllCoupons = async (filters = {}, pagination = {}) => {
    const {
        isActive,
        discountType,
        search,
        validStatus, // 'active', 'expired', 'upcoming'
    } = filters;

    const {
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
    } = pagination;

    // Build query
    const query = {};

    if (isActive !== undefined) {
        query.isActive = isActive;
    }

    if (discountType) {
        query.discountType = discountType;
    }

    if (search) {
        query.$or = [
            { code: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
        ];
    }

    // Filter by validity status
    const now = new Date();
    if (validStatus === "active") {
        query.validFrom = { $lte: now };
        query.validTo = { $gte: now };
        query.isActive = true;
    } else if (validStatus === "expired") {
        query.validTo = { $lt: now };
    } else if (validStatus === "upcoming") {
        query.validFrom = { $gt: now };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const sortOptions = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [coupons, total] = await Promise.all([
        Coupon.find(query)
            .populate("applicableCategories", "name")
            .populate("applicableProducts", "productName")
            .populate("createdBy", "name email")
            .populate("updatedBy", "name email")
            .sort(sortOptions)
            .limit(limit)
            .skip(skip)
            .lean(),
        Coupon.countDocuments(query),
    ]);

    return {
        data: coupons,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get coupon by ID
 */
const getCouponById = async (couponId) => {
    const coupon = await Coupon.findById(couponId)
        .populate("applicableCategories", "name")
        .populate("applicableProducts", "productName")
        .populate("applicableUsers", "firstName lastName email phone")
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email")
        .lean();

    if (!coupon) {
        throw new Error("Coupon not found");
    }

    return coupon;
};

/**
 * Get coupon by code
 */
const getCouponByCode = async (couponCode) => {
    const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
    })
        .populate("applicableCategories", "name")
        .populate("applicableProducts", "productName")
        .lean();

    if (!coupon) {
        throw new Error("Coupon not found");
    }

    return coupon;
};

/**
 * Update coupon
 */
const updateCoupon = async (couponId, updates, adminId) => {
    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
        throw new Error("Coupon not found");
    }

    // If code is being updated, check for duplicates
    if (updates.code && updates.code !== coupon.code) {
        const existingCoupon = await Coupon.findOne({
            code: updates.code.toUpperCase(),
            _id: { $ne: couponId },
        });

        if (existingCoupon) {
            throw new Error("Coupon code already exists");
        }
        updates.code = updates.code.toUpperCase();
    }

    // Validate dates if being updated
    const validFrom = updates.validFrom
        ? new Date(updates.validFrom)
        : coupon.validFrom;
    const validTo = updates.validTo
        ? new Date(updates.validTo)
        : coupon.validTo;

    if (validTo <= validFrom) {
        throw new Error("Valid to date must be after valid from date");
    }

    // Update coupon
    Object.assign(coupon, updates, {
        updatedBy: adminId,
    });

    await coupon.save();

    logger.info(`Coupon updated: ${coupon.code} by admin ${adminId}`);

    return await getCouponById(couponId);
};

/**
 * Delete coupon
 */
const deleteCoupon = async (couponId) => {
    const coupon = await Coupon.findByIdAndDelete(couponId);

    if (!coupon) {
        throw new Error("Coupon not found");
    }

    logger.info(`Coupon deleted: ${coupon.code}`);

    return coupon;
};

/**
 * Toggle coupon active status
 */
const toggleCouponStatus = async (couponId, adminId) => {
    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
        throw new Error("Coupon not found");
    }

    coupon.isActive = !coupon.isActive;
    coupon.updatedBy = adminId;
    await coupon.save();

    logger.info(
        `Coupon ${coupon.code} status changed to ${coupon.isActive ? "active" : "inactive"}`,
    );

    return coupon;
};

/**
 * Get coupon statistics
 */
const getCouponStats = async (couponId) => {
    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
        throw new Error("Coupon not found");
    }

    const orderStats = await Order.aggregate([
        { $match: { "appliedCoupon.code": coupon.code } },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: "$pricing.total" },
                totalDiscount: { $sum: "$appliedCoupon.discountAmount" },
            },
        },
    ]);

    const stats = orderStats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        totalDiscount: 0,
    };

    // Get unique users count from CouponUsage collection
    const uniqueUsers = await CouponUsage.getUniqueUserCount(coupon._id);

    return {
        coupon: {
            code: coupon.code,
            description: coupon.description,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            usageCount: coupon.usageCount,
            usageLimit: coupon.usageLimit,
            uniqueUsers,
        },
        stats,
    };
};

/**
 * Get coupon usage history with pagination
 */
const getCouponUsageHistory = async (couponId, pagination = {}) => {
    const { page = 1, limit = 20 } = pagination;

    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
        throw new Error("Coupon not found");
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
        Order.find({ "appliedCoupon.code": coupon.code })
            .populate("customer", "firstName lastName email phone")
            .select(
                "orderNumber customer appliedCoupon pricing.total createdAt orderStatus",
            )
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .lean(),
        Order.countDocuments({ "appliedCoupon.code": coupon.code }),
    ]);

    return {
        data: orders,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

/**
 * Duplicate coupon (create a copy)
 */
const duplicateCoupon = async (couponId, newCode, adminId) => {
    const originalCoupon = await Coupon.findById(couponId).lean();

    if (!originalCoupon) {
        throw new Error("Coupon not found");
    }

    // Check if new code already exists
    const existingCoupon = await Coupon.findOne({
        code: newCode.toUpperCase(),
    });

    if (existingCoupon) {
        throw new Error("Coupon code already exists");
    }

    // Create duplicate
    const duplicateData = {
        ...originalCoupon,
        _id: undefined,
        code: newCode.toUpperCase(),
        usageCount: 0,
        createdBy: adminId,
        createdAt: undefined,
        updatedAt: undefined,
    };

    const duplicate = await Coupon.create(duplicateData);

    logger.info(
        `Coupon duplicated: ${originalCoupon.code} → ${duplicate.code} by admin ${adminId}`,
    );

    return duplicate;
};

export {
    createCoupon,
    getAllCoupons,
    getCouponById,
    getCouponByCode,
    updateCoupon,
    deleteCoupon,
    toggleCouponStatus,
    getCouponStats,
    getCouponUsageHistory,
    duplicateCoupon,
};
