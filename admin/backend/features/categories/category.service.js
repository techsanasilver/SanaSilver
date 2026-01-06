import Category from "./category.model.js";
import logger from "../../shared/utils/logger.util.js";
import {
    uploadSingleImage,
    deleteImage,
    getImageVariants,
} from "../../shared/utils/cloudinary.util.js";
import {
    generateSlug,
    validateParent,
    calculateLevel,
    buildCategoryTree,
} from "./category.util.js";

/**
 * Create a new category
 */
async function createCategory(data, imageFile, adminId) {
    const {
        name,
        description,
        parent,
        sortOrder,
        metaTitle,
        metaDescription,
        metaKeywords,
    } = data;

    // Check if category name already exists
    const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existingCategory) {
        throw new Error("Category with this name already exists");
    }

    // Validate parent if provided
    if (parent) {
        await validateParent(parent);
    }

    // Upload image to Cloudinary if provided
    let imageData = null;
    if (imageFile && imageFile.buffer) {
        const slugBase = generateSlug(name);
        const uploadResult = await uploadSingleImage(
            imageFile.buffer,
            "categories",
            `cat_${slugBase}`
        );

        imageData = {
            publicId: uploadResult.publicId,
            alt: name,
        };
    }

    // Create category
    const category = await Category.create({
        name,
        description,
        image: imageData,
        parent: parent || null,
        sortOrder: sortOrder || 0,
        metaTitle,
        metaDescription,
        metaKeywords: metaKeywords || [],
        createdBy: adminId,
    });

    logger.info(`Category created: ${name} by admin ${adminId}`);

    // Populate parent and generate image URLs
    const populatedCategory = await Category.findById(category._id)
        .populate("parent", "name slug")
        .lean();

    if (populatedCategory.image && populatedCategory.image.publicId) {
        populatedCategory.image.urls = getImageVariants(
            populatedCategory.image.publicId
        );
    }

    return { data: populatedCategory };
}

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

/**
 * Update category
 */
async function updateCategory(categoryId, updates, imageFile, adminId) {
    const {
        name,
        description,
        parent,
        sortOrder,
        metaTitle,
        metaDescription,
        metaKeywords,
    } = updates;

    const category = await Category.findById(categoryId);

    if (!category) {
        throw new Error("Category not found");
    }

    // Check if name is being changed and if new name already exists
    if (name && name !== category.name) {
        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${name}$`, "i") },
            _id: { $ne: categoryId },
        });

        if (existingCategory) {
            throw new Error("Category with this name already exists");
        }
        category.name = name;
    }

    // Validate parent if being changed
    if (parent !== undefined && String(parent) !== String(category.parent)) {
        // Prevent setting category as its own parent
        if (String(parent) === String(categoryId)) {
            throw new Error("Category cannot be its own parent");
        }

        // Validate new parent
        if (parent) {
            await validateParent(parent);

            // Prevent circular references
            let currentParent = await Category.findById(parent);
            while (currentParent && currentParent.parent) {
                if (String(currentParent.parent) === String(categoryId)) {
                    throw new Error("Circular reference detected");
                }
                currentParent = await Category.findById(currentParent.parent);
            }
        }

        category.parent = parent || null;
    }

    // Update other fields
    if (description !== undefined) category.description = description;
    if (sortOrder !== undefined) category.sortOrder = sortOrder;
    if (metaTitle !== undefined) category.metaTitle = metaTitle;
    if (metaDescription !== undefined)
        category.metaDescription = metaDescription;
    if (metaKeywords !== undefined) category.metaKeywords = metaKeywords;

    // Handle image upload if provided
    if (imageFile && imageFile.buffer) {
        // Delete old image from Cloudinary if exists
        if (category.image && category.image.publicId) {
            await deleteImage(category.image.publicId);
            logger.info(
                `Old image deleted: ${category.image.publicId} for category ${category.name}`
            );
        }

        // Upload new image to Cloudinary
        // Use updated name if provided, otherwise use current name
        const categoryNameForSlug = name || category.name;
        const slugBase = generateSlug(categoryNameForSlug);
        const uploadResult = await uploadSingleImage(
            imageFile.buffer,
            "categories",
            `cat_${slugBase}`
        );

        category.image = {
            publicId: uploadResult.publicId,
            alt: categoryNameForSlug,
        };

        logger.info(
            `New image uploaded: ${uploadResult.publicId} for category ${categoryNameForSlug}`
        );
    }

    category.updatedBy = adminId;

    await category.save();

    logger.info(`Category updated: ${category.name} by admin ${adminId}`);

    // Return populated category
    const updatedCategory = await Category.findById(categoryId)
        .populate("parent", "name slug")
        .populate("updatedBy", "name email")
        .lean();

    if (updatedCategory.image && updatedCategory.image.publicId) {
        updatedCategory.image.urls = getImageVariants(
            updatedCategory.image.publicId
        );
    }

    return { data: updatedCategory };
}

/**
 * Upload/update category image
 */
async function updateCategoryImage(categoryId, imageFile, adminId) {
    const category = await Category.findById(categoryId);

    if (!category) {
        throw new Error("Category not found");
    }

    // Delete old image if exists
    if (category.image && category.image.publicId) {
        await deleteImage(category.image.publicId);
    }

    // Upload new image - generate fresh slug from current name
    const slugBase = generateSlug(category.name);
    const uploadResult = await uploadSingleImage(
        imageFile.buffer,
        "categories",
        `cat_${slugBase}`
    );

    category.image = {
        publicId: uploadResult.publicId,
        alt: category.name,
    };
    category.updatedBy = adminId;

    await category.save();

    logger.info(`Category image updated: ${category.name} by admin ${adminId}`);

    // Return category with image URLs
    const updatedCategory = category.toObject();
    updatedCategory.image.urls = getImageVariants(
        updatedCategory.image.publicId
    );

    return { data: updatedCategory };
}

/**
 * Remove category image
 */
async function removeCategoryImage(categoryId, adminId) {
    const category = await Category.findById(categoryId);

    if (!category) {
        throw new Error("Category not found");
    }

    if (!category.image || !category.image.publicId) {
        throw new Error("Category has no image");
    }

    // Delete from Cloudinary
    await deleteImage(category.image.publicId);

    category.image = null;
    category.updatedBy = adminId;

    await category.save();

    logger.info(`Category image removed: ${category.name} by admin ${adminId}`);

    return { data: category };
}

/**
 * Toggle category status
 */
async function toggleCategoryStatus(categoryId, isActive, adminId) {
    const category = await Category.findById(categoryId);

    if (!category) {
        throw new Error("Category not found");
    }

    category.isActive = isActive;
    category.updatedBy = adminId;

    await category.save();

    logger.info(
        `Category status changed to ${isActive ? "active" : "inactive"}: ${
            category.name
        }`
    );

    return { data: category };
}

/**
 * Update sort order
 */
async function updateSortOrder(categoryId, sortOrder, adminId) {
    const category = await Category.findById(categoryId);

    if (!category) {
        throw new Error("Category not found");
    }

    category.sortOrder = sortOrder;
    category.updatedBy = adminId;

    await category.save();

    logger.info(`Category sort order updated: ${category.name}`);

    return { data: category };
}

/**
 * Soft delete category
 */
async function softDeleteCategory(categoryId, adminId) {
    const category = await Category.findById(categoryId);

    if (!category) {
        throw new Error("Category not found");
    }

    // Check if has children
    const childrenCount = await Category.countDocuments({ parent: categoryId });
    if (childrenCount > 0) {
        throw new Error(
            "Cannot delete category with subcategories. Delete subcategories first."
        );
    }

    // Check if has products (will implement when product model is ready)
    // const productCount = await Product.countDocuments({ category: categoryId });
    // if (productCount > 0) {
    //     throw new Error("Cannot delete category with products. Reassign products first.");
    // }

    category.isActive = false;
    category.updatedBy = adminId;

    await category.save();

    logger.info(`Category soft deleted: ${category.name} by admin ${adminId}`);

    return { data: { message: "Category deactivated successfully" } };
}

/**
 * Hard delete category (permanent)
 */
async function hardDeleteCategory(categoryId, adminId) {
    const category = await Category.findById(categoryId);

    if (!category) {
        throw new Error("Category not found");
    }

    // Check if has children
    const childrenCount = await Category.countDocuments({ parent: categoryId });
    if (childrenCount > 0) {
        throw new Error(
            "Cannot delete category with subcategories. Delete subcategories first."
        );
    }

    // Check if has products (will implement when product model is ready)
    // const productCount = await Product.countDocuments({ category: categoryId });
    // if (productCount > 0) {
    //     throw new Error("Cannot delete category with products. Reassign products first.");
    // }

    // Delete image from Cloudinary if exists
    if (category.image && category.image.publicId) {
        await deleteImage(category.image.publicId);
    }

    await Category.findByIdAndDelete(categoryId);

    logger.info(
        `Category permanently deleted: ${category.name} by admin ${adminId}`
    );

    return { data: { message: "Category deleted permanently" } };
}

export {
    createCategory,
    getAllCategories,
    getCategoryById,
    getCategoryBySlug,
    getCategoryTree,
    updateCategory,
    updateCategoryImage,
    removeCategoryImage,
    toggleCategoryStatus,
    updateSortOrder,
    softDeleteCategory,
    hardDeleteCategory,
};
