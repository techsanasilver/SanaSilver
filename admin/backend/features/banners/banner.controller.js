import * as bannerService from "./banner.service.js";
import {
    validateBannerCreate,
    validateBannerUpdate,
} from "./banner.validation.js";
import apiResponse from "../../shared/utils/response.util.js";

/**
 * @route   POST /api/banners
 * @desc    Create a new banner
 * @access  Private (Admin)
 */
const createBanner = async (req, res) => {
    try {
        // Validate input
        const validation = validateBannerCreate(req.body);
        if (!validation.isValid) {
            return apiResponse.validationError(
                res,
                "Validation failed",
                validation.errors
            );
        }

        // Check if images are provided
        if (!req.files || req.files.length < 1) {
            return apiResponse.badRequest(res, "Desktop image is required");
        }

        // Create banner
        const banner = await bannerService.createBanner(req.body, req.files);

        return apiResponse.created(res, "Banner created successfully", banner);
    } catch (error) {
        console.error("Error creating banner:", error);
        return apiResponse.serverError(
            res,
            error.message || "Failed to create banner"
        );
    }
};

/**
 * @route   GET /api/banners
 * @desc    Get all banners with optional filtering
 * @access  Public
 */
const getAllBanners = async (req, res) => {
    try {
        const { isActive, displayLocation, scheduled } = req.query;

        const filters = {};
        if (isActive !== undefined) filters.isActive = isActive;
        if (displayLocation) filters.displayLocation = displayLocation;
        if (scheduled !== undefined) filters.scheduled = scheduled;

        const banners = await bannerService.getAllBanners(filters);

        return apiResponse.success(res, "Banners fetched successfully", {
            count: banners.length,
            banners,
        });
    } catch (error) {
        console.error("Error fetching banners:", error);
        return apiResponse.serverError(
            res,
            error.message || "Failed to fetch banners"
        );
    }
};

/**
 * @route   GET /api/banners/:id
 * @desc    Get a single banner by ID
 * @access  Public
 */
const getBannerById = async (req, res) => {
    try {
        const banner = await bannerService.getBannerById(req.params.id);
        return apiResponse.success(res, "Banner fetched successfully", banner);
    } catch (error) {
        console.error("Error fetching banner:", error);
        if (error.message === "Banner not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.serverError(
            res,
            error.message || "Failed to fetch banner"
        );
    }
};

/**
 * @route   PUT /api/banners/:id
 * @desc    Update a banner
 * @access  Private (Admin)
 */
const updateBanner = async (req, res) => {
    try {
        // Validate input
        const validation = validateBannerUpdate(req.body);
        if (!validation.isValid) {
            return apiResponse.validationError(
                res,
                "Validation failed",
                validation.errors
            );
        }

        // Update banner
        const banner = await bannerService.updateBanner(
            req.params.id,
            req.body,
            req.files
        );

        return apiResponse.success(res, "Banner updated successfully", banner);
    } catch (error) {
        console.error("Error updating banner:", error);
        if (error.message === "Banner not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.serverError(
            res,
            error.message || "Failed to update banner"
        );
    }
};

/**
 * @route   DELETE /api/banners/:id
 * @desc    Soft delete a banner (deactivate)
 * @access  Private (Admin)
 */
const softDeleteBanner = async (req, res) => {
    try {
        const result = await bannerService.softDeleteBanner(req.params.id);
        return apiResponse.success(res, result.message, result.banner);
    } catch (error) {
        console.error("Error deactivating banner:", error);
        if (error.message === "Banner not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.serverError(
            res,
            error.message || "Failed to deactivate banner"
        );
    }
};

/**
 * @route   DELETE /api/banners/:id/force
 * @desc    Hard delete a banner permanently
 * @access  Private (Admin)
 */
const hardDeleteBanner = async (req, res) => {
    try {
        const result = await bannerService.hardDeleteBanner(req.params.id);
        return apiResponse.success(res, result.message);
    } catch (error) {
        console.error("Error deleting banner:", error);
        if (error.message === "Banner not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.serverError(
            res,
            error.message || "Failed to delete banner"
        );
    }
};

/**
 * @route   PATCH /api/banners/:id/status
 * @desc    Update banner active status
 * @access  Private (Admin)
 */
const updateBannerStatus = async (req, res) => {
    try {
        const { isActive } = req.body;

        if (typeof isActive !== "boolean") {
            return apiResponse.badRequest(res, "isActive must be a boolean");
        }

        const banner = await bannerService.updateBannerStatus(
            req.params.id,
            isActive
        );
        return apiResponse.success(
            res,
            "Banner status updated successfully",
            banner
        );
    } catch (error) {
        console.error("Error updating banner status:", error);
        if (error.message === "Banner not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.serverError(
            res,
            error.message || "Failed to update banner status"
        );
    }
};

/**
 * @route   POST /api/banners/reorder
 * @desc    Reorder banners (bulk update)
 * @access  Private (Admin)
 */
const reorderBanners = async (req, res) => {
    try {
        const { orders } = req.body;

        if (!Array.isArray(orders) || orders.length === 0) {
            return apiResponse.badRequest(res, "Orders array is required");
        }

        // Validate order structure
        for (const order of orders) {
            if (!order.id || typeof order.sortOrder !== "number") {
                return apiResponse.badRequest(
                    res,
                    "Each order must have id and sortOrder"
                );
            }
        }

        const result = await bannerService.reorderBanners(orders);
        return apiResponse.success(res, result.message);
    } catch (error) {
        console.error("Error reordering banners:", error);
        return apiResponse.serverError(
            res,
            error.message || "Failed to reorder banners"
        );
    }
};

export {
    createBanner,
    getAllBanners,
    getBannerById,
    updateBanner,
    softDeleteBanner,
    hardDeleteBanner,
    updateBannerStatus,
    reorderBanners,
};
