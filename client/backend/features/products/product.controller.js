import {
    getAllProducts,
    getProductById,
    getProductBySlug,
    getVariantById,
    getProductVariants,
} from "./product.service.js";
import apiResponse from "../../shared/utils/response.util.js";
import logger from "../../shared/utils/logger.util.js";

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
            gemstone,
            occasion,
            plating,
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
        if (gemstone) filters.gemstone = gemstone;
        if (occasion) filters.occasion = occasion;
        if (plating) filters.plating = plating;
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
            result.pagination,
        );
    } catch (error) {
        logger.error("Get all products error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

export const getProductByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await getProductById(id);

        return apiResponse.success(
            res,
            "Product retrieved successfully",
            product,
        );
    } catch (error) {
        logger.error("Get product by ID error:", error.message);
        if (error.message === "Product not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.error(res, error.message);
    }
};

export const getProductBySlugController = async (req, res) => {
    try {
        const { slug } = req.params;
        const product = await getProductBySlug(slug);

        return apiResponse.success(
            res,
            "Product retrieved successfully",
            product,
        );
    } catch (error) {
        logger.error("Get product by slug error:", error.message);
        if (error.message === "Product not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.error(res, error.message);
    }
};

export const getVariantByIdController = async (req, res) => {
    try {
        const { variantId } = req.params;
        const variant = await getVariantById(variantId);

        return apiResponse.success(
            res,
            "Variant retrieved successfully",
            variant,
        );
    } catch (error) {
        logger.error("Get variant by ID error:", error.message);
        if (error.message === "Variant not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.error(res, error.message);
    }
};

export const getProductVariantsController = async (req, res) => {
    try {
        const { productId } = req.params;
        const variants = await getProductVariants(productId);

        return apiResponse.success(
            res,
            "Variants retrieved successfully",
            variants,
        );
    } catch (error) {
        logger.error("Get product variants error:", error.message);
        return apiResponse.error(res, error.message);
    }
};
