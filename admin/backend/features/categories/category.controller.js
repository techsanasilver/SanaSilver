import * as categoryService from "./category.service.js";
import apiResponse from "../../shared/utils/response.util.js";
import logger from "../../shared/utils/logger.util.js";
import {
    sanitizePagination,
    parseBoolean,
    parseInt as parseIntSafe,
    isValidObjectId,
    trimStringFields,
} from "../../shared/utils/validation.util.js";

/**
 * Create new category
 */
const create = async (req, res) => {
    try {
        // Trim all string fields
        const categoryData = trimStringFields(req.body);
        const imageFile = req.file;
        const adminId = req.admin._id;

        const result = await categoryService.createCategory(
            categoryData,
            imageFile,
            adminId
        );

        return apiResponse.created(
            res,
            "Category created successfully",
            result.data
        );
    } catch (error) {
        logger.error("Create category error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Get all categories with filters
 */
const getAll = async (req, res) => {
    try {
        // Sanitize and validate filters
        const filters = {};

        // Parse boolean isActive
        const isActive = parseBoolean(req.query.isActive);
        if (isActive !== undefined) {
            filters.isActive = isActive;
        }

        // Validate and set parent ID
        if (req.query.parent && isValidObjectId(req.query.parent)) {
            filters.parent = req.query.parent;
        }

        // Set search term
        if (req.query.search && req.query.search.trim() !== "") {
            filters.search = req.query.search.trim();
        }

        // Parse level (0-3)
        const level = parseIntSafe(req.query.level, undefined, {
            min: 0,
            max: 3,
        });
        if (level !== undefined) {
            filters.level = level;
        }

        // Parse includeInactive
        filters.includeInactive = parseBoolean(
            req.query.includeInactive,
            false
        );

        // Sanitize pagination
        const pagination = sanitizePagination(req.query, {
            defaultPage: 1,
            defaultLimit: 20,
            maxLimit: 100,
            defaultSortBy: "sortOrder",
            defaultSortOrder: "asc",
            allowedSortFields: ["sortOrder", "name", "createdAt", "updatedAt"],
        });

        const result = await categoryService.getAllCategories(
            filters,
            pagination
        );

        return apiResponse.successWithPagination(
            res,
            "Categories retrieved successfully",
            result.data,
            result.pagination
        );
    } catch (error) {
        logger.error("Get all categories error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Get single category by ID
 */
const getById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await categoryService.getCategoryById(id);

        return apiResponse.success(
            res,
            "Category retrieved successfully",
            result.data
        );
    } catch (error) {
        logger.error("Get category by ID error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Get single category by slug
 */
const getBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const result = await categoryService.getCategoryBySlug(slug);

        return apiResponse.success(
            res,
            "Category retrieved successfully",
            result.data
        );
    } catch (error) {
        logger.error("Get category by slug error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Get category tree structure
 */
const getTree = async (req, res) => {
    try {
        const result = await categoryService.getCategoryTree();

        return apiResponse.success(
            res,
            "Category tree retrieved successfully",
            result.data
        );
    } catch (error) {
        logger.error("Get category tree error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Update category
 */
const update = async (req, res) => {
    try {
        const { id } = req.params;
        // Trim all string fields
        const updates = trimStringFields(req.body);
        const imageFile = req.file;
        const adminId = req.admin._id;

        const result = await categoryService.updateCategory(
            id,
            updates,
            imageFile,
            adminId
        );

        return apiResponse.success(
            res,
            "Category updated successfully",
            result.data
        );
    } catch (error) {
        logger.error("Update category error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Upload/update category image
 */
const uploadImage = async (req, res) => {
    try {
        const { id } = req.params;
        const imageFile = req.file;
        const adminId = req.admin._id;

        if (!imageFile) {
            return apiResponse.badRequest(res, "Image file is required");
        }

        const result = await categoryService.updateCategoryImage(
            id,
            imageFile,
            adminId
        );

        return apiResponse.success(
            res,
            "Category image updated successfully",
            result.data
        );
    } catch (error) {
        logger.error("Upload category image error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Remove category image
 */
const deleteImage = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin._id;

        const result = await categoryService.removeCategoryImage(id, adminId);

        return apiResponse.success(
            res,
            "Category image removed successfully",
            result.data
        );
    } catch (error) {
        logger.error("Delete category image error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Toggle category status
 */
const toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const adminId = req.admin._id;

        if (typeof isActive !== "boolean") {
            return apiResponse.badRequest(res, "isActive must be a boolean");
        }

        const result = await categoryService.toggleCategoryStatus(
            id,
            isActive,
            adminId
        );

        return apiResponse.success(
            res,
            `Category ${isActive ? "activated" : "deactivated"} successfully`,
            result.data
        );
    } catch (error) {
        logger.error("Toggle category status error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Update sort order
 */
const reorder = async (req, res) => {
    try {
        const { id } = req.params;
        const { sortOrder } = req.body;
        const adminId = req.admin._id;

        if (typeof sortOrder !== "number" || sortOrder < 0) {
            return apiResponse.badRequest(
                res,
                "sortOrder must be a non-negative number"
            );
        }

        const result = await categoryService.updateSortOrder(
            id,
            sortOrder,
            adminId
        );

        return apiResponse.success(
            res,
            "Category order updated successfully",
            result.data
        );
    } catch (error) {
        logger.error("Reorder category error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Soft delete category
 */
const softDelete = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin._id;

        const result = await categoryService.softDeleteCategory(id, adminId);

        return apiResponse.success(
            res,
            "Category deactivated successfully",
            result.data
        );
    } catch (error) {
        logger.error("Soft delete category error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Hard delete category (permanent)
 */
const hardDelete = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin._id;

        const result = await categoryService.hardDeleteCategory(id, adminId);

        return apiResponse.success(
            res,
            "Category deleted permanently",
            result.data
        );
    } catch (error) {
        logger.error("Hard delete category error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

export {
    create,
    getAll,
    getById,
    getBySlug,
    getTree,
    update,
    uploadImage,
    deleteImage,
    toggleStatus,
    reorder,
    softDelete,
    hardDelete,
};
