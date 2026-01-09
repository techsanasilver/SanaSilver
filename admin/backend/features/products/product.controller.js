import {
    createProduct,
    getAllProducts,
    getProductById,
    getProductBySlug,
    updateProduct,
    softDeleteProduct,
    hardDeleteProduct,
    createVariant,
    updateVariant,
    softDeleteVariant,
    hardDeleteVariant,
    updateVariantStock,
    getVariantById,
    getProductVariants,
    uploadProductImages,
    deleteProductImages,
    uploadVariantImages,
    deleteVariantImages,
} from "./product.service.js";
import { parseFormDataVariants } from "./product.util.js";
import apiResponse from "../../shared/utils/response.util.js";
import logger from "../../shared/utils/logger.util.js";

/**
 * Create product with variants (nested create)
 */
export const createProductController = async (req, res) => {
    try {
        const adminId = req.admin._id;

        // Variants already parsed by middleware
        const variants = req.body.variants;

        // Extract product data (exclude variants)
        const { variants: _, ...productData } = req.body;

        // Get uploaded image files
        const imageFiles = req.files || [];

        // Create product with variants and images
        const product = await createProduct(
            productData,
            imageFiles,
            variants,
            adminId
        );

        return apiResponse.created(
            res,
            "Product created successfully",
            product
        );
    } catch (error) {
        logger.error("Create product error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Get all products with filtering and pagination
 */
export const getAllProductsController = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            category,
            subcategory,
            collections,
            purity,
            isFeatured,
            gender,
            minPrice,
            maxPrice,
            inStock,
            search,
            sortBy,
            attributes,
        } = req.query;

        // Build filters
        const filters = {};
        if (category) filters.category = category;
        if (subcategory) filters.subcategory = subcategory;
        if (collections) filters.collections = collections.split(",");
        if (purity) filters.purity = purity;
        if (isFeatured !== undefined)
            filters.isFeatured = isFeatured === "true";
        if (gender) filters.gender = gender;
        if (minPrice) filters.minPrice = parseFloat(minPrice);
        if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
        if (inStock !== undefined) filters.inStock = inStock === "true";
        if (search) filters.search = search;
        if (sortBy) filters.sortBy = sortBy;

        // Parse variant attributes filter
        if (attributes) {
            try {
                filters.attributes = JSON.parse(attributes);
            } catch (e) {
                return apiResponse.badRequest(res, "Invalid attributes format");
            }
        }

        // Pagination
        const pagination = {
            page: parseInt(page),
            limit: parseInt(limit),
        };

        const result = await getAllProducts(filters, pagination);

        return apiResponse.successWithPagination(
            res,
            "Products retrieved successfully",
            result.data,
            result.pagination
        );
    } catch (error) {
        logger.error("Get all products error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Get single product by ID
 */
export const getProductByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await getProductById(id);

        return apiResponse.success(
            res,
            "Product retrieved successfully",
            product
        );
    } catch (error) {
        logger.error("Get product by ID error:", error.message);
        if (error.message === "Product not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.error(res, error.message);
    }
};

/**
 * Get single product by slug
 */
export const getProductBySlugController = async (req, res) => {
    try {
        const { slug } = req.params;
        const product = await getProductBySlug(slug);

        return apiResponse.success(
            res,
            "Product retrieved successfully",
            product
        );
    } catch (error) {
        logger.error("Get product by slug error:", error.message);
        if (error.message === "Product not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.error(res, error.message);
    }
};

/**
 * Update product with variants (nested update)
 */
export const updateProductController = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin._id;

        // Variants, deleteVariants, deleteImages already parsed by middleware
        const variants = req.body.variants;
        const deleteVariants = req.body.deleteVariants;
        const deleteImages = req.body.deleteImages;

        // Validate deleteVariants array contains valid ObjectIds
        if (
            deleteVariants &&
            Array.isArray(deleteVariants) &&
            deleteVariants.length > 0
        ) {
            const invalidIds = deleteVariants.filter(
                (id) => !id || !/^[0-9a-fA-F]{24}$/.test(id)
            );
            if (invalidIds.length > 0) {
                return apiResponse.badRequest(
                    res,
                    "deleteVariants contains invalid IDs"
                );
            }
        }

        // Validate deleteImages array
        if (
            deleteImages &&
            Array.isArray(deleteImages) &&
            deleteImages.length > 0
        ) {
            const invalidPublicIds = deleteImages.filter(
                (id) => !id || typeof id !== "string"
            );
            if (invalidPublicIds.length > 0) {
                return apiResponse.badRequest(
                    res,
                    "deleteImages contains invalid publicIds"
                );
            }
        }

        // Extract product data (exclude special fields)
        const {
            variants: _,
            deleteVariants: __,
            deleteImages: ___,
            images: ____,
            ...productUpdates
        } = req.body;

        // Get uploaded image files (if any)
        const imageFiles = req.files || [];

        // Update product with variants and images
        const product = await updateProduct(
            id,
            productUpdates,
            imageFiles,
            deleteImages || [],
            variants || [],
            deleteVariants || [],
            adminId
        );

        return apiResponse.success(
            res,
            "Product updated successfully",
            product
        );
    } catch (error) {
        logger.error("Update product error:", error.message);
        if (error.message === "Product not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.error(res, error.message);
    }
};

/**
 * Soft delete product (deactivate)
 */
export const softDeleteProductController = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin._id;

        const result = await softDeleteProduct(id, adminId);

        return apiResponse.success(
            res,
            "Product deactivated successfully",
            result.data
        );
    } catch (error) {
        logger.error("Soft delete product error:", error.message);
        if (error.message === "Product not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.error(res, error.message);
    }
};

/**
 * Hard delete product (permanent)
 */
export const hardDeleteProductController = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin._id;

        const result = await hardDeleteProduct(id, adminId);

        return apiResponse.success(
            res,
            "Product deleted permanently",
            result.data
        );
    } catch (error) {
        logger.error("Hard delete product error:", error.message);
        if (error.message === "Product not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.error(res, error.message);
    }
};

// ===== VARIANT-SPECIFIC CONTROLLERS =====

/**
 * Create a single variant for existing product
 */
export const createVariantController = async (req, res) => {
    try {
        const { productId } = req.params;
        const adminId = req.admin._id;
        const { images: _, ...variantData } = req.body;

        // Get uploaded image files
        const imageFiles = req.files || [];

        const variant = await createVariant(
            productId,
            variantData,
            imageFiles,
            adminId
        );

        return apiResponse.created(
            res,
            "Variant created successfully",
            variant
        );
    } catch (error) {
        logger.error("Create variant error:", error.message);
        if (error.message === "Product not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.error(res, error.message);
    }
};

/**
 * Update a single variant
 */
export const updateVariantController = async (req, res) => {
    try {
        const { variantId } = req.params;
        const adminId = req.admin._id;

        // deleteImages already parsed by middleware
        const deleteImages = req.body.deleteImages;

        // Extract variant data (exclude special fields)
        const { images: _, deleteImages: __, ...updates } = req.body;

        // Get uploaded image files (if any)
        const imageFiles = req.files || [];

        const variant = await updateVariant(
            variantId,
            updates,
            imageFiles,
            deleteImages || [],
            adminId
        );

        return apiResponse.success(
            res,
            "Variant updated successfully",
            variant
        );
    } catch (error) {
        logger.error("Update variant error:", error.message);
        if (error.message === "Variant not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.error(res, error.message);
    }
};

/**
 * Soft delete variant (deactivate)
 */
export const softDeleteVariantController = async (req, res) => {
    try {
        const { productId, variantId } = req.params;
        const adminId = req.admin._id;

        const result = await softDeleteVariant(productId, variantId, adminId);

        return apiResponse.success(
            res,
            "Variant deactivated successfully",
            result.data
        );
    } catch (error) {
        logger.error("Soft delete variant error:", error.message);
        if (error.message === "Variant not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.error(res, error.message);
    }
};

/**
 * Hard delete variant (permanent)
 */
export const hardDeleteVariantController = async (req, res) => {
    try {
        const { productId, variantId } = req.params;
        const adminId = req.admin._id;

        const result = await hardDeleteVariant(productId, variantId, adminId);

        return apiResponse.success(
            res,
            "Variant deleted permanently",
            result.data
        );
    } catch (error) {
        logger.error("Hard delete variant error:", error.message);
        if (error.message === "Variant not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.error(res, error.message);
    }
};

/**
 * Update variant stock (quick update)
 */
export const updateVariantStockController = async (req, res) => {
    try {
        const { variantId } = req.params;
        const { stockQuantity } = req.body;

        const variant = await updateVariantStock(variantId, stockQuantity);

        return apiResponse.success(res, "Stock updated successfully", variant);
    } catch (error) {
        logger.error("Update variant stock error:", error.message);
        if (error.message === "Variant not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.error(res, error.message);
    }
};

/**
 * Get variant by ID
 */
export const getVariantByIdController = async (req, res) => {
    try {
        const { variantId } = req.params;
        const variant = await getVariantById(variantId);

        return apiResponse.success(
            res,
            "Variant retrieved successfully",
            variant
        );
    } catch (error) {
        logger.error("Get variant by ID error:", error.message);
        if (error.message === "Variant not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.error(res, error.message);
    }
};

/**
 * Get all variants for a product
 */
export const getProductVariantsController = async (req, res) => {
    try {
        const { productId } = req.params;
        const variants = await getProductVariants(productId);

        return apiResponse.success(
            res,
            "Variants retrieved successfully",
            variants
        );
    } catch (error) {
        logger.error("Get product variants error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Upload/Add images to product
 */
export const uploadProductImagesController = async (req, res) => {
    try {
        const { id } = req.params;
        const imageFiles = req.files;
        const adminId = req.admin._id;

        if (!imageFiles || imageFiles.length === 0) {
            return apiResponse.badRequest(
                res,
                "At least one image file is required"
            );
        }

        const product = await uploadProductImages(id, imageFiles, adminId);

        return apiResponse.success(
            res,
            "Product images uploaded successfully",
            product
        );
    } catch (error) {
        logger.error("Upload product images error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Delete images from product
 */
export const deleteProductImagesController = async (req, res) => {
    try {
        const { id } = req.params;
        const { publicIds } = req.body;
        const adminId = req.admin._id;

        if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
            return apiResponse.badRequest(res, "publicIds array is required");
        }

        const product = await deleteProductImages(id, publicIds, adminId);

        return apiResponse.success(
            res,
            "Product images deleted successfully",
            product
        );
    } catch (error) {
        logger.error("Delete product images error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Upload/Add images to variant
 */
export const uploadVariantImagesController = async (req, res) => {
    try {
        const { variantId } = req.params;
        const imageFiles = req.files;
        const adminId = req.admin._id;

        if (!imageFiles || imageFiles.length === 0) {
            return apiResponse.badRequest(
                res,
                "At least one image file is required"
            );
        }

        const variant = await uploadVariantImages(
            variantId,
            imageFiles,
            adminId
        );

        return apiResponse.success(
            res,
            "Variant images uploaded successfully",
            variant
        );
    } catch (error) {
        logger.error("Upload variant images error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Delete images from variant
 */
export const deleteVariantImagesController = async (req, res) => {
    try {
        const { variantId } = req.params;
        const { publicIds } = req.body;
        const adminId = req.admin._id;

        if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
            return apiResponse.badRequest(res, "publicIds array is required");
        }

        const variant = await deleteVariantImages(
            variantId,
            publicIds,
            adminId
        );

        return apiResponse.success(
            res,
            "Variant images deleted successfully",
            variant
        );
    } catch (error) {
        logger.error("Delete variant images error:", error.message);
        return apiResponse.error(res, error.message);
    }
};
