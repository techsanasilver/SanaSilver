import express from "express";
import {
    createProductController,
    getAllProductsController,
    getProductByIdController,
    getProductBySlugController,
    updateProductController,
    softDeleteProductController,
    hardDeleteProductController,
    createVariantController,
    updateVariantController,
    softDeleteVariantController,
    hardDeleteVariantController,
    updateVariantStockController,
    getVariantByIdController,
    getProductVariantsController,
    uploadProductImagesController,
    deleteProductImagesController,
    uploadVariantImagesController,
    deleteVariantImagesController,
} from "./product.controller.js";
import authMiddleware from "../../shared/middlewares/auth.middleware.js";
import { requirePermission } from "../../shared/middlewares/role.middleware.js";
import {
    uploadMultiple,
    validateImageUpload,
} from "../../shared/middlewares/upload.middleware.js";
import {
    validateCreateProduct,
    validateUpdateProduct,
    validateCreateVariant,
    validateUpdateVariant,
    validateUpdateStock,
} from "./product.validation.js";
import { parseFormDataJSON } from "./product.middleware.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * Validation middleware
 */
const validate = (validationFn) => {
    return (req, res, next) => {
        const { isValid, errors } = validationFn(req.body);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors,
            });
        }

        next();
    };
};

// ===== PRODUCT ROUTES =====

/**
 * @route   POST /api/products
 * @desc    Create product with variants (nested create)
 * @access  Private (Admin)
 */
router.post(
    "/",
    requirePermission("products.create"),
    uploadMultiple("images", 10),
    validateImageUpload({
        required: true,
        minFiles: 1,
        maxFiles: 10,
        uploadType: "product",
    }),
    parseFormDataJSON,
    validate(validateCreateProduct),
    createProductController
);

/**
 * @route   GET /api/products
 * @desc    Get all products with filtering and pagination
 * @access  Public or Private
 */
router.get("/", getAllProductsController);

/**
 * @route   GET /api/products/slug/:slug
 * @desc    Get product by slug
 * @access  Public
 */
router.get("/slug/:slug", getProductBySlugController);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get("/:id", getProductByIdController);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product with variants (nested update)
 *          Can also add new images via files and delete old images via deleteImages array
 * @access  Private (Admin)
 */
router.put(
    "/:id",
    requirePermission("products.edit"),
    uploadMultiple("images", 10),
    validateImageUpload({
        required: false,
        maxFiles: 10,
        uploadType: "product",
    }),
    parseFormDataJSON,
    validate(validateUpdateProduct),
    updateProductController
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Soft delete product (deactivate)
 * @access  Private (Admin)
 */
router.delete(
    "/:id",
    requirePermission("products.delete"),
    softDeleteProductController
);

/**
 * @route   DELETE /api/products/:id/force
 * @desc    Hard delete product (force delete - permanent)
 * @access  Private (Admin)
 */
router.delete(
    "/:id/force",
    requirePermission("products.delete"),
    hardDeleteProductController
);

// ===== PRODUCT IMAGE ROUTES =====

/**
 * @route   POST /api/products/:id/images
 * @desc    Upload/Add images to product
 * @access  Private (Admin)
 */
router.post(
    "/:id/images",
    requirePermission("products.edit"),
    uploadMultiple("images", 10),
    validateImageUpload({
        required: true,
        minFiles: 1,
        maxFiles: 10,
        uploadType: "product",
    }),
    uploadProductImagesController
);

/**
 * @route   DELETE /api/products/:id/images
 * @desc    Delete specific images from product
 * @access  Private (Admin)
 */
router.delete(
    "/:id/images",
    requirePermission("products.edit"),
    deleteProductImagesController
);

// ===== VARIANT ROUTES =====

/**
 * @route   GET /api/products/:productId/variants
 * @desc    Get all variants for a product
 * @access  Public
 */
router.get("/:productId/variants", getProductVariantsController);

/**
 * @route   POST /api/products/:productId/variants
 * @desc    Create a single variant for existing product
 * @access  Private (Admin)
 */
router.post(
    "/:productId/variants",
    requirePermission("products.create"),
    uploadMultiple("images", 5),
    validateImageUpload({
        required: false,
        maxFiles: 5,
        uploadType: "product",
    }),
    parseFormDataJSON,
    validate(validateCreateVariant),
    createVariantController
);

/**
 * @route   GET /api/products/variants/:variantId
 * @desc    Get variant by ID
 * @access  Public
 */
router.get("/variants/:variantId", getVariantByIdController);

/**
 * @route   PUT /api/products/variants/:variantId
 * @desc    Update a single variant
 *          Can also add new images via files and delete old images via deleteImages array
 * @access  Private (Admin)
 */
router.put(
    "/variants/:variantId",
    requirePermission("products.edit"),
    uploadMultiple("images", 5),
    validateImageUpload({
        required: false,
        maxFiles: 5,
        uploadType: "product",
    }),
    parseFormDataJSON,
    validate(validateUpdateVariant),
    updateVariantController
);

/**
 * @route   PATCH /api/products/variants/:variantId/stock
 * @desc    Update variant stock (quick update)
 * @access  Private (Admin)
 */
router.patch(
    "/variants/:variantId/stock",
    requirePermission("products.edit"),
    validate(validateUpdateStock),
    updateVariantStockController
);

/**
 * @route   DELETE /api/products/:productId/variants/:variantId
 * @desc    Soft delete variant (deactivate)
 * @access  Private (Admin)
 */
router.delete(
    "/:productId/variants/:variantId",
    requirePermission("products.delete"),
    softDeleteVariantController
);

/**
 * @route   DELETE /api/products/:productId/variants/:variantId/force
 * @desc    Hard delete variant (force delete - permanent)
 * @access  Private (Admin)
 */
router.delete(
    "/:productId/variants/:variantId/force",
    requirePermission("products.delete"),
    hardDeleteVariantController
);

// ===== VARIANT IMAGE ROUTES =====

/**
 * @route   POST /api/products/variants/:variantId/images
 * @desc    Upload/Add images to variant
 * @access  Private (Admin)
 */
router.post(
    "/variants/:variantId/images",
    requirePermission("products.edit"),
    uploadMultiple("images", 5),
    validateImageUpload({
        required: true,
        minFiles: 1,
        maxFiles: 5,
        uploadType: "product",
    }),
    uploadVariantImagesController
);

/**
 * @route   DELETE /api/products/variants/:variantId/images
 * @desc    Delete specific images from variant
 * @access  Private (Admin)
 */
router.delete(
    "/variants/:variantId/images",
    requirePermission("products.edit"),
    deleteVariantImagesController
);

export default router;
