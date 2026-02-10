import * as couponService from "./coupon.service.js";
import apiResponse from "../../shared/utils/response.util.js";
import logger from "../../shared/utils/logger.util.js";
import {
    sanitizePagination,
    parseBoolean,
    isValidObjectId,
    trimStringFields,
} from "../../shared/utils/validation.util.js";

/**
 * Create new coupon
 * POST /api/coupons
 */
const create = async (req, res) => {
    try {
        const couponData = trimStringFields(req.body);
        const adminId = req.admin._id;

        const coupon = await couponService.createCoupon(couponData, adminId);

        return apiResponse.created(res, "Coupon created successfully", coupon);
    } catch (error) {
        logger.error("Create coupon error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Get all coupons with filters and pagination
 * GET /api/coupons
 */
const getAll = async (req, res) => {
    try {
        const filters = {};

        // Parse isActive
        const isActive = parseBoolean(req.query.isActive);
        if (isActive !== undefined) {
            filters.isActive = isActive;
        }

        // Discount type filter
        if (req.query.discountType) {
            filters.discountType = req.query.discountType;
        }

        // Search filter
        if (req.query.search && req.query.search.trim() !== "") {
            filters.search = req.query.search.trim();
        }

        // Valid status filter (active/expired/upcoming)
        if (req.query.validStatus) {
            filters.validStatus = req.query.validStatus;
        }

        // Pagination
        const pagination = sanitizePagination(req.query, {
            defaultPage: 1,
            defaultLimit: 20,
            maxLimit: 100,
        });

        const result = await couponService.getAllCoupons(filters, pagination);

        return apiResponse.successWithPagination(
            res,
            "Coupons retrieved successfully",
            result.data,
            result.pagination,
        );
    } catch (error) {
        logger.error("Get all coupons error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Get coupon by ID
 * GET /api/coupons/:id
 */
const getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return apiResponse.badRequest(res, "Invalid coupon ID");
        }

        const coupon = await couponService.getCouponById(id);

        return apiResponse.success(
            res,
            "Coupon retrieved successfully",
            coupon,
        );
    } catch (error) {
        logger.error("Get coupon by ID error:", error.message);
        if (error.message === "Coupon not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.error(res, error.message);
    }
};

/**
 * Get coupon by code
 * GET /api/coupons/code/:code
 */
const getByCode = async (req, res) => {
    try {
        const { code } = req.params;

        if (!code || code.trim() === "") {
            return apiResponse.badRequest(res, "Coupon code is required");
        }

        const coupon = await couponService.getCouponByCode(code);

        return apiResponse.success(
            res,
            "Coupon retrieved successfully",
            coupon,
        );
    } catch (error) {
        logger.error("Get coupon by code error:", error.message);
        if (error.message === "Coupon not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.error(res, error.message);
    }
};

/**
 * Update coupon
 * PUT /api/coupons/:id
 */
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = trimStringFields(req.body);
        const adminId = req.admin._id;

        if (!isValidObjectId(id)) {
            return apiResponse.badRequest(res, "Invalid coupon ID");
        }

        const coupon = await couponService.updateCoupon(id, updates, adminId);

        return apiResponse.success(res, "Coupon updated successfully", coupon);
    } catch (error) {
        logger.error("Update coupon error:", error.message);
        if (error.message === "Coupon not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.error(res, error.message);
    }
};

/**
 * Delete coupon
 * DELETE /api/coupons/:id
 */
const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return apiResponse.badRequest(res, "Invalid coupon ID");
        }

        await couponService.deleteCoupon(id);

        return apiResponse.success(res, "Coupon deleted successfully", null);
    } catch (error) {
        logger.error("Delete coupon error:", error.message);
        if (error.message === "Coupon not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.error(res, error.message);
    }
};

/**
 * Toggle coupon active status
 * PATCH /api/coupons/:id/toggle-status
 */
const toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin._id;

        if (!isValidObjectId(id)) {
            return apiResponse.badRequest(res, "Invalid coupon ID");
        }

        const coupon = await couponService.toggleCouponStatus(id, adminId);

        return apiResponse.success(
            res,
            `Coupon ${coupon.isActive ? "activated" : "deactivated"} successfully`,
            coupon,
        );
    } catch (error) {
        logger.error("Toggle coupon status error:", error.message);
        if (error.message === "Coupon not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.error(res, error.message);
    }
};

/**
 * Get coupon statistics
 * GET /api/coupons/:id/stats
 */
const getStats = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return apiResponse.badRequest(res, "Invalid coupon ID");
        }

        const stats = await couponService.getCouponStats(id);

        return apiResponse.success(
            res,
            "Coupon statistics retrieved successfully",
            stats,
        );
    } catch (error) {
        logger.error("Get coupon stats error:", error.message);
        if (error.message === "Coupon not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.error(res, error.message);
    }
};

/**
 * Get coupon usage history
 * GET /api/coupons/:id/usage-history
 */
const getUsageHistory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return apiResponse.badRequest(res, "Invalid coupon ID");
        }

        const pagination = sanitizePagination(req.query, {
            defaultPage: 1,
            defaultLimit: 20,
            maxLimit: 100,
        });

        const result = await couponService.getCouponUsageHistory(
            id,
            pagination,
        );

        return apiResponse.successWithPagination(
            res,
            "Coupon usage history retrieved successfully",
            result.data,
            result.pagination,
        );
    } catch (error) {
        logger.error("Get coupon usage history error:", error.message);
        if (error.message === "Coupon not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.error(res, error.message);
    }
};

/**
 * Duplicate coupon
 * POST /api/coupons/:id/duplicate
 */
const duplicate = async (req, res) => {
    try {
        const { id } = req.params;
        const { newCode } = req.body;
        const adminId = req.admin._id;

        if (!isValidObjectId(id)) {
            return apiResponse.badRequest(res, "Invalid coupon ID");
        }

        if (!newCode || newCode.trim() === "") {
            return apiResponse.badRequest(res, "New coupon code is required");
        }

        const coupon = await couponService.duplicateCoupon(
            id,
            newCode.trim(),
            adminId,
        );

        return apiResponse.created(
            res,
            "Coupon duplicated successfully",
            coupon,
        );
    } catch (error) {
        logger.error("Duplicate coupon error:", error.message);
        if (error.message === "Coupon not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.error(res, error.message);
    }
};

export {
    create,
    getAll,
    getById,
    getByCode,
    update,
    deleteCoupon,
    toggleStatus,
    getStats,
    getUsageHistory,
    duplicate,
};
