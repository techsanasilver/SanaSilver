import * as categoryService from "./category.service.js";
import apiResponse from "../../shared/utils/response.util.js";
import logger from "../../shared/utils/logger.util.js";
import {
    sanitizePagination,
    parseBoolean,
    parseInt as parseIntSafe,
    isValidObjectId,
} from "../../shared/utils/validation.util.js";

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
            false,
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
            pagination,
        );

        return apiResponse.successWithPagination(
            res,
            "Categories retrieved successfully",
            result.data,
            result.pagination,
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
            result.data,
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
            result.data,
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
            result.data,
        );
    } catch (error) {
        logger.error("Get category tree error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

export { getAll, getById, getBySlug, getTree };
