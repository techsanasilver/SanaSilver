import Product from "./product.model.js";
import ProductVariant from "./product-variant.model.js";
import { sortVariants, buildProductFilterPipeline } from "./product.util.js";
import { getImageVariants } from "../../shared/utils/cloudinary.util.js";
import logger from "../../shared/utils/logger.util.js";

export const getAllProducts = async (filters = {}, pagination = {}) => {
    try {
        const { page = 1, limit = 20 } = pagination;
        const skip = (page - 1) * limit;

        // Build aggregation pipeline
        const pipeline = buildProductFilterPipeline(filters);

        // Add pagination
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });

        // Execute aggregation
        const products = await Product.aggregate(pipeline);

        // Generate image URLs for all products
        products.forEach((product) => {
            if (product.images && product.images.length > 0) {
                product.images = product.images.map((img) => ({
                    ...img,
                    urls: getImageVariants(img.publicId),
                }));
            }
        });

        // Get total count
        const countPipeline = buildProductFilterPipeline(filters);
        countPipeline.push({ $count: "total" });
        const countResult = await Product.aggregate(countPipeline);
        const total = countResult[0]?.total || 0;

        return {
            data: products,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        logger.error("Get all products error:", error.message);
        throw new Error(`Failed to retrieve products: ${error.message}`);
    }
};

export const getProductById = async (productId) => {
    const product = await Product.findById(productId)
        .populate("category subcategory")
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email");

    if (!product) {
        throw new Error(`Product not found with ID: ${productId}`);
    }

    // Get all variants
    const variants = await ProductVariant.find({
        product: productId,
        isActive: true,
    });

    const productWithVariants = product.toObject();

    // Calculate minPrice, maxPrice, and totalStock
    if (variants && variants.length > 0) {
        productWithVariants.minPrice = Math.min(
            ...variants.map((v) => v.sellingPrice),
        );
        productWithVariants.maxPrice = Math.max(
            ...variants.map((v) => v.sellingPrice),
        );
        productWithVariants.totalStock = variants.reduce(
            (sum, v) => sum + (v.stockQuantity || 0),
            0,
        );
    } else {
        productWithVariants.minPrice = null;
        productWithVariants.maxPrice = null;
        productWithVariants.totalStock = 0;
    }

    // Generate URLs for product images
    if (productWithVariants.images && productWithVariants.images.length > 0) {
        productWithVariants.images = productWithVariants.images.map((img) => ({
            ...img,
            urls: getImageVariants(img.publicId),
        }));
    }

    // Generate URLs for variant images and sort
    productWithVariants.variants = sortVariants(variants).map((variant) => {
        const variantObj = variant.toObject ? variant.toObject() : variant;
        if (variantObj.images && variantObj.images.length > 0) {
            variantObj.images = variantObj.images.map((img) => ({
                ...img,
                urls: getImageVariants(img.publicId),
            }));
        }
        return variantObj;
    });

    return productWithVariants;
};

export const getProductBySlug = async (slug) => {
    const product = await Product.findOne({ slug, isActive: true })
        .populate("category subcategory")
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email");

    if (!product) {
        throw new Error(`Product not found with slug: ${slug}`);
    }

    // Get all variants
    const variants = await ProductVariant.find({
        product: product._id,
        isActive: true,
    });

    const productWithVariants = product.toObject();

    // Calculate minPrice, maxPrice, and totalStock
    if (variants && variants.length > 0) {
        productWithVariants.minPrice = Math.min(
            ...variants.map((v) => v.sellingPrice),
        );
        productWithVariants.maxPrice = Math.max(
            ...variants.map((v) => v.sellingPrice),
        );
        productWithVariants.totalStock = variants.reduce(
            (sum, v) => sum + (v.stockQuantity || 0),
            0,
        );
    } else {
        productWithVariants.minPrice = null;
        productWithVariants.maxPrice = null;
        productWithVariants.totalStock = 0;
    }

    // Generate URLs for product images
    if (productWithVariants.images && productWithVariants.images.length > 0) {
        productWithVariants.images = productWithVariants.images.map((img) => ({
            ...img,
            urls: getImageVariants(img.publicId),
        }));
    }

    // Generate URLs for variant images and sort
    productWithVariants.variants = sortVariants(variants).map((variant) => {
        const variantObj = variant.toObject ? variant.toObject() : variant;
        if (variantObj.images && variantObj.images.length > 0) {
            variantObj.images = variantObj.images.map((img) => ({
                ...img,
                urls: getImageVariants(img.publicId),
            }));
        }
        return variantObj;
    });

    return productWithVariants;
};

export const getVariantById = async (variantId) => {
    const variant = await ProductVariant.findById(variantId).populate({
        path: "product",
        populate: { path: "category" },
    });

    if (!variant) {
        throw new Error("Variant not found");
    }

    // Generate URLs for variant images
    const variantObj = variant.toObject();
    if (variantObj.images && variantObj.images.length > 0) {
        variantObj.images = variantObj.images.map((img) => ({
            ...img,
            urls: getImageVariants(img.publicId),
        }));
    }

    return variantObj;
};

export const getProductVariants = async (productId) => {
    const variants = await ProductVariant.find({
        product: productId,
        isActive: true,
    });

    // Generate URLs for all variant images
    const variantsWithUrls = sortVariants(variants).map((variant) => {
        const variantObj = variant.toObject ? variant.toObject() : variant;
        if (variantObj.images && variantObj.images.length > 0) {
            variantObj.images = variantObj.images.map((img) => ({
                ...img,
                urls: getImageVariants(img.publicId),
            }));
        }
        return variantObj;
    });

    return variantsWithUrls;
};
