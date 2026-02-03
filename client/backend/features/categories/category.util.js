import Category from "./category.model.js";
import { getImageVariants } from "../../shared/utils/cloudinary.util.js";

/**
 * Generate unique slug from category name
 */
export const generateSlug = (name) => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

/**
 * Validate parent category exists and is active
 */
export const validateParent = async (parentId) => {
    if (!parentId) return null;

    const parent = await Category.findById(parentId);

    if (!parent) {
        throw new Error("Parent category not found");
    }

    if (!parent.isActive) {
        throw new Error("Parent category is inactive");
    }

    // Prevent too deep nesting (max 3 levels: 0, 1, 2)
    if (parent.level >= 2) {
        throw new Error("Maximum category depth is 3 levels");
    }

    return parent;
};

/**
 * Calculate category level based on parent
 */
export const calculateLevel = async (parentId) => {
    if (!parentId) return 0;

    const parent = await Category.findById(parentId);
    return parent ? parent.level + 1 : 0;
};

/**
 * Build hierarchical category tree
 */
export const buildCategoryTree = async (categories, parentId = null) => {
    const tree = [];

    for (const category of categories) {
        if (
            String(category.parent || null) === String(parentId || null) ||
            (!category.parent && !parentId)
        ) {
            const categoryObj = category.toObject
                ? category.toObject()
                : category;

            // Generate image variants if image exists
            if (categoryObj.image && categoryObj.image.publicId) {
                categoryObj.image.urls = getImageVariants(
                    categoryObj.image.publicId
                );
            }

            // Recursively get children
            const children = await buildCategoryTree(
                categories,
                categoryObj._id
            );
            if (children.length > 0) {
                categoryObj.children = children;
            }

            tree.push(categoryObj);
        }
    }

    return tree.sort((a, b) => a.sortOrder - b.sortOrder);
};
