import mongoose from "mongoose";
import Product from "./product.model.js";
import ProductVariant from "./product-variant.model.js";
import Category from "../categories/category.model.js";
import {
    generateVariantSKU,
    generateSlug,
    validateAttributes,
    sortVariants,
    buildProductFilterPipeline,
} from "./product.util.js";

/**
 * Create a new product with variants (nested create)
 */
export const createProduct = async (
    productData,
    variants,
    adminId,
    session = null
) => {
    const isExternalSession = !!session;
    const localSession = session || (await mongoose.startSession());

    try {
        if (!isExternalSession) {
            localSession.startTransaction();
        }

        // Validate minimum 1 variant
        if (!variants || variants.length === 0) {
            throw new Error("At least one variant is required");
        }

        // Validate category exists
        const category = await Category.findById(productData.category).session(
            localSession
        );
        if (!category) {
            throw new Error("Category not found");
        }

        // Generate unique slug if not provided
        if (!productData.slug) {
            productData.slug = await generateSlug(productData.name);
        }

        // Add createdBy
        productData.createdBy = adminId;

        // Create product
        const [product] = await Product.create([productData], {
            session: localSession,
        });

        // Create variants
        const createdVariants = [];
        for (let i = 0; i < variants.length; i++) {
            const variantData = variants[i];

            // Validate attributes
            if (variantData.attributes && variantData.attributes.length > 0) {
                const attrValidation = validateAttributes(
                    variantData.attributes
                );
                if (!attrValidation.valid) {
                    throw new Error(
                        `Variant ${i + 1}: ${attrValidation.message}`
                    );
                }
            }

            // Generate SKU if not provided
            if (!variantData.sku) {
                variantData.sku = await generateVariantSKU(
                    category.name,
                    product.name,
                    i + 1,
                    variantData.attributes || []
                );
            }

            // Set product reference
            variantData.product = product._id;
            variantData.createdBy = adminId;

            // Create variant
            const [variant] = await ProductVariant.create([variantData], {
                session: localSession,
            });
            createdVariants.push(variant);
        }

        if (!isExternalSession) {
            await localSession.commitTransaction();
        }

        // Return product with variants
        const productWithVariants = product.toObject();
        productWithVariants.variants = createdVariants;
        return productWithVariants;
    } catch (error) {
        if (!isExternalSession) {
            await localSession.abortTransaction();
        }
        throw error;
    } finally {
        if (!isExternalSession) {
            localSession.endSession();
        }
    }
};

/**
 * Get all products with filtering and pagination
 */
export const getAllProducts = async (filters = {}, pagination = {}) => {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    // Build aggregation pipeline
    const pipeline = buildProductFilterPipeline(filters);

    // Add pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Execute aggregation
    const products = await Product.aggregate(pipeline);

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
};

/**
 * Get product by ID with variants
 */
export const getProductById = async (productId) => {
    const product = await Product.findById(productId).populate(
        "category subcategory"
    );

    if (!product) {
        throw new Error("Product not found");
    }

    // Get all variants
    const variants = await ProductVariant.find({
        product: productId,
        isActive: true,
    });

    const productWithVariants = product.toObject();
    productWithVariants.variants = sortVariants(variants);
    return productWithVariants;
};

/**
 * Get product by slug with variants
 */
export const getProductBySlug = async (slug) => {
    const product = await Product.findOne({ slug, isActive: true }).populate(
        "category subcategory"
    );

    if (!product) {
        throw new Error("Product not found");
    }

    // Get all variants
    const variants = await ProductVariant.find({
        product: product._id,
        isActive: true,
    });

    const productWithVariants = product.toObject();
    productWithVariants.variants = sortVariants(variants);
    return productWithVariants;
};

/**
 * Update product with variants (nested update)
 */
export const updateProduct = async (
    productId,
    productUpdates,
    variants = [],
    deleteVariantIds = [],
    adminId,
    session = null
) => {
    const isExternalSession = !!session;
    const localSession = session || (await mongoose.startSession());

    try {
        if (!isExternalSession) {
            localSession.startTransaction();
        }

        // Find product
        const product = await Product.findById(productId).session(localSession);
        if (!product) {
            throw new Error("Product not found");
        }

        // Get category for SKU generation
        const categoryId = productUpdates.category || product.category;
        const category = await Category.findById(categoryId).session(
            localSession
        );

        // Update slug if name changed
        if (productUpdates.name && productUpdates.name !== product.name) {
            productUpdates.slug = await generateSlug(productUpdates.name);
        }

        // Update product
        productUpdates.updatedBy = adminId;
        Object.assign(product, productUpdates);
        await product.save({ session: localSession });

        // Process variants
        const updatedVariants = [];

        // Handle variant updates and creates
        for (let i = 0; i < variants.length; i++) {
            const variantData = variants[i];

            // Validate attributes
            if (variantData.attributes && variantData.attributes.length > 0) {
                const attrValidation = validateAttributes(
                    variantData.attributes
                );
                if (!attrValidation.valid) {
                    throw new Error(
                        `Variant ${i + 1}: ${attrValidation.message}`
                    );
                }
            }

            if (variantData._id) {
                // Update existing variant
                const variant = await ProductVariant.findById(
                    variantData._id
                ).session(localSession);
                if (!variant) {
                    throw new Error(
                        `Variant with ID ${variantData._id} not found`
                    );
                }

                variantData.updatedBy = adminId;
                Object.assign(variant, variantData);
                await variant.save({ session: localSession });
                updatedVariants.push(variant);
            } else {
                // Create new variant
                if (!variantData.sku) {
                    const existingVariants = await ProductVariant.find({
                        product: productId,
                    }).session(localSession);
                    variantData.sku = await generateVariantSKU(
                        category.name,
                        product.name,
                        existingVariants.length + i + 1,
                        variantData.attributes || []
                    );
                }

                variantData.product = productId;
                variantData.createdBy = adminId;

                const [variant] = await ProductVariant.create([variantData], {
                    session: localSession,
                });
                updatedVariants.push(variant);
            }
        }

        // Delete variants
        if (deleteVariantIds && deleteVariantIds.length > 0) {
            await ProductVariant.deleteMany(
                {
                    _id: { $in: deleteVariantIds },
                    product: productId,
                },
                { session: localSession }
            );
        }

        // Ensure at least 1 variant remains
        const remainingVariants = await ProductVariant.countDocuments({
            product: productId,
        }).session(localSession);

        if (remainingVariants === 0) {
            throw new Error("Product must have at least one variant");
        }

        if (!isExternalSession) {
            await localSession.commitTransaction();
        }

        // Get all current variants for response
        const allVariants = await ProductVariant.find({
            product: productId,
            isActive: true,
        });

        const productWithVariants = product.toObject();
        productWithVariants.variants = sortVariants(allVariants);
        return productWithVariants;
    } catch (error) {
        if (!isExternalSession) {
            await localSession.abortTransaction();
        }
        throw error;
    } finally {
        if (!isExternalSession) {
            localSession.endSession();
        }
    }
};

/**
 * Delete product and all its variants
 */
/**
 * Soft delete product (deactivate)
 */
export const softDeleteProduct = async (productId, adminId) => {
    const product = await Product.findById(productId);

    if (!product) {
        throw new Error("Product not found");
    }

    // Deactivate product
    product.isActive = false;
    product.updatedBy = adminId;
    await product.save();

    // Deactivate all variants
    await ProductVariant.updateMany(
        { product: productId },
        { isActive: false, updatedBy: adminId }
    );

    return {
        data: { message: "Product and variants deactivated successfully" },
    };
};

/**
 * Hard delete product (permanent)
 */
export const hardDeleteProduct = async (productId, adminId, session = null) => {
    const isExternalSession = !!session;
    const localSession = session || (await mongoose.startSession());

    try {
        if (!isExternalSession) {
            localSession.startTransaction();
        }

        // Find product
        const product = await Product.findById(productId).session(localSession);
        if (!product) {
            throw new Error("Product not found");
        }

        // Delete all variants
        await ProductVariant.deleteMany(
            { product: productId },
            { session: localSession }
        );

        // Delete product
        await Product.findByIdAndDelete(productId).session(localSession);

        if (!isExternalSession) {
            await localSession.commitTransaction();
        }

        return {
            data: { message: "Product and all variants deleted permanently" },
        };
    } catch (error) {
        if (!isExternalSession) {
            await localSession.abortTransaction();
        }
        throw error;
    } finally {
        if (!isExternalSession) {
            localSession.endSession();
        }
    }
};

/**
 * Create a single variant for existing product
 */
export const createVariant = async (productId, variantData, adminId) => {
    // Validate product exists
    const product = await Product.findById(productId).populate("category");
    if (!product) {
        throw new Error("Product not found");
    }

    // Validate attributes
    if (variantData.attributes && variantData.attributes.length > 0) {
        const attrValidation = validateAttributes(variantData.attributes);
        if (!attrValidation.valid) {
            throw new Error(attrValidation.message);
        }
    }

    // Generate SKU if not provided
    if (!variantData.sku) {
        const existingVariants = await ProductVariant.find({
            product: productId,
        });
        variantData.sku = await generateVariantSKU(
            product.category.name,
            product.name,
            existingVariants.length + 1,
            variantData.attributes || []
        );
    }

    // Set product reference
    variantData.product = productId;
    variantData.createdBy = adminId;

    // Create variant
    const variant = await ProductVariant.create(variantData);

    return variant;
};

/**
 * Update a single variant
 */
export const updateVariant = async (variantId, updates, adminId) => {
    const variant = await ProductVariant.findById(variantId);

    if (!variant) {
        throw new Error("Variant not found");
    }

    // Validate attributes if provided
    if (updates.attributes && updates.attributes.length > 0) {
        const attrValidation = validateAttributes(updates.attributes);
        if (!attrValidation.valid) {
            throw new Error(attrValidation.message);
        }
    }

    // Update variant
    updates.updatedBy = adminId;
    Object.assign(variant, updates);
    await variant.save();

    return variant;
};

/**
 * Delete a single variant
 */
/**
 * Soft delete variant (deactivate)
 */
export const softDeleteVariant = async (productId, variantId, adminId) => {
    // Check if product has more than 1 active variant
    const activeVariantCount = await ProductVariant.countDocuments({
        product: productId,
        isActive: true,
    });

    if (activeVariantCount <= 1) {
        throw new Error(
            "Cannot deactivate the last active variant. Product must have at least one active variant."
        );
    }

    // Deactivate variant
    const variant = await ProductVariant.findOneAndUpdate(
        {
            _id: variantId,
            product: productId,
        },
        {
            isActive: false,
            updatedBy: adminId,
        },
        { new: true }
    );

    if (!variant) {
        throw new Error("Variant not found");
    }

    return { data: { message: "Variant deactivated successfully" } };
};

/**
 * Hard delete variant (permanent)
 */
export const hardDeleteVariant = async (productId, variantId, adminId) => {
    // Check if product has more than 1 variant
    const variantCount = await ProductVariant.countDocuments({
        product: productId,
    });

    if (variantCount <= 1) {
        throw new Error(
            "Cannot delete the last variant. Product must have at least one variant."
        );
    }

    // Delete variant
    const variant = await ProductVariant.findOneAndDelete({
        _id: variantId,
        product: productId,
    });

    if (!variant) {
        throw new Error("Variant not found");
    }

    return { data: { message: "Variant deleted permanently" } };
};

/**
 * Update variant stock
 */
export const updateVariantStock = async (variantId, stockQuantity) => {
    const variant = await ProductVariant.findById(variantId);

    if (!variant) {
        throw new Error("Variant not found");
    }

    variant.stockQuantity = stockQuantity;
    await variant.save();

    return variant;
};

/**
 * Get variant by ID
 */
export const getVariantById = async (variantId) => {
    const variant = await ProductVariant.findById(variantId).populate({
        path: "product",
        populate: { path: "category" },
    });

    if (!variant) {
        throw new Error("Variant not found");
    }

    return variant;
};

/**
 * Get all variants for a product
 */
export const getProductVariants = async (productId) => {
    const variants = await ProductVariant.find({
        product: productId,
        isActive: true,
    });

    return sortVariants(variants);
};
