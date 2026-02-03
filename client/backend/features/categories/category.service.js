import Category from "./category.model.js";
import logger from "../../shared/utils/logger.util.js";
import { getImageVariants } from "../../shared/utils/cloudinary.util.js";
import { buildCategoryTree } from "./category.util.js";

/**
 * Get all categories with filters and pagination
 */
async function getAllCategories(filters = {}, pagination = {}) {
    const {
        isActive,
        parent,
        search,
        level,
        includeInactive = false,
    } = filters;

    const {
        page = 1,
        limit = 20,
        sortBy = "sortOrder",
        sortOrder = "asc",
    } = pagination;

    // Build query
    const query = {};

    if (isActive !== undefined && !includeInactive) {
        query.isActive = isActive;
    }

    if (parent !== undefined) {
        query.parent = parent === "null" || parent === null ? null : parent;
    }

    if (search) {
        query.name = { $regex: search, $options: "i" };
    }

    if (level !== undefined) {
        query.level = parseInt(level);
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const sortOptions = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [categories, total] = await Promise.all([
        Category.find(query)
            .populate("parent", "name slug")
            .sort(sortOptions)
            .limit(limit)
            .skip(skip)
            .lean(),
        Category.countDocuments(query),
    ]);

    // Generate image URLs for all categories
    categories.forEach((category) => {
        if (category.image && category.image.publicId) {
            category.image.urls = getImageVariants(category.image.publicId);
        }
    });

    return {
        data: categories,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
}

/**
 * Get category by ID
 */
async function getCategoryById(categoryId) {
    const category = await Category.findById(categoryId)
        .populate("parent", "name slug level")
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email")
        .lean();

    if (!category) {
        throw new Error("Category not found");
    }

    // Get children
    const children = await Category.find({ parent: categoryId, isActive: true })
        .sort({ sortOrder: 1 })
        .lean();

    // Generate image URLs
    if (category.image && category.image.publicId) {
        category.image.urls = getImageVariants(category.image.publicId);
    }

    children.forEach((child) => {
        if (child.image && child.image.publicId) {
            child.image.urls = getImageVariants(child.image.publicId);
        }
    });

    category.children = children;

    return { data: category };
}

/**
 * Get category by slug
 */
async function getCategoryBySlug(slug) {
    const category = await Category.findOne({ slug })
        .populate("parent", "name slug level")
        .lean();

    if (!category) {
        throw new Error("Category not found");
    }

    if (!category.isActive) {
        throw new Error("Category is inactive");
    }

    // Get children
    const children = await Category.find({
        parent: category._id,
        isActive: true,
    })
        .sort({ sortOrder: 1 })
        .lean();

    // Generate image URLs
    if (category.image && category.image.publicId) {
        category.image.urls = getImageVariants(category.image.publicId);
    }

    children.forEach((child) => {
        if (child.image && child.image.publicId) {
            child.image.urls = getImageVariants(child.image.publicId);
        }
    });

    category.children = children;

    return { data: category };
}

/**
 * Get category tree (hierarchical structure)
 */
async function getCategoryTree() {
    // Get all active categories
    const categories = await Category.find({ isActive: true })
        .sort({ sortOrder: 1, name: 1 })
        .lean();

    // Build tree structure
    const tree = await buildCategoryTree(categories, null);

    return { data: tree };
}

export {
    getAllCategories,
    getCategoryById,
    getCategoryBySlug,
    getCategoryTree,
};
