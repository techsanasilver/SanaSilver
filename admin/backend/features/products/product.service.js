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
import {
    uploadMultipleImages,
    deleteMultipleImages,
    getImageVariants,
} from "../../shared/utils/cloudinary.util.js";
import logger from "../../shared/utils/logger.util.js";

/**
 * Create a new product with variants (nested create)
 */
export const createProduct = async (
    productData,
    imageFiles,
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
            throw new Error(
                `Category not found with ID: ${productData.category}`
            );
        }

        // Generate unique slug if not provided
        if (!productData.slug) {
            productData.slug = await generateSlug(productData.name);
        }

        // Handle image uploads with cleanup on failure
        let uploadedImages = [];
        try {
            if (imageFiles && imageFiles.length > 0) {
                const slugBase = productData.slug;
                const imageBuffers = imageFiles.map((file) => file.buffer);
                uploadedImages = await uploadMultipleImages(
                    imageBuffers,
                    "products",
                    `prod_${slugBase}`
                );

                // Format images for database
                productData.images = uploadedImages.map((img, index) => ({
                    publicId: img.publicId,
                    url: img.secureUrl,
                    alt: productData.name,
                    sortOrder: index,
                    isPrimary: index === 0,
                }));
            }

            // Validate product has at least one image
            if (!productData.images || productData.images.length === 0) {
                throw new Error("Product must have at least one image");
            }
        } catch (uploadError) {
            // Clean up any uploaded images on failure
            if (uploadedImages.length > 0) {
                const publicIds = uploadedImages.map((img) => img.publicId);
                try {
                    await deleteMultipleImages(publicIds);
                    logger.info(
                        `Cleaned up ${publicIds.length} images after upload failure`
                    );
                } catch (cleanupError) {
                    logger.error(
                        "Failed to cleanup images:",
                        cleanupError.message
                    );
                }
            }
            throw uploadError;
        }

        // Add createdBy
        productData.createdBy = adminId;

        // Create product
        let product;
        try {
            [product] = await Product.create([productData], {
                session: localSession,
            });
        } catch (createError) {
            // Check for duplicate slug error
            if (createError.code === 11000 && createError.keyPattern?.slug) {
                throw new Error(
                    `Product with slug "${productData.slug}" already exists`
                );
            }
            throw createError;
        }

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

        // Return product with variants and generate image URLs
        const productWithVariants = product.toObject();

        // Generate URLs for product images
        if (
            productWithVariants.images &&
            productWithVariants.images.length > 0
        ) {
            productWithVariants.images = productWithVariants.images.map(
                (img) => ({
                    ...img,
                    urls: getImageVariants(img.publicId),
                })
            );
        }

        // Generate URLs for variant images
        productWithVariants.variants = createdVariants.map((variant) => {
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

/**
 * Get product by ID with variants
 */
export const getProductById = async (productId) => {
    const product = await Product.findById(productId).populate(
        "category subcategory"
    );

    if (!product) {
        throw new Error(`Product not found with ID: ${productId}`);
    }

    // Get all variants
    const variants = await ProductVariant.find({
        product: productId,
        isActive: true,
    });

    const productWithVariants = product.toObject();

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

/**
 * Get product by slug with variants
 */
export const getProductBySlug = async (slug) => {
    const product = await Product.findOne({ slug, isActive: true }).populate(
        "category subcategory"
    );

    if (!product) {
        throw new Error(`Product not found with slug: ${slug}`);
    }

    // Get all variants
    const variants = await ProductVariant.find({
        product: product._id,
        isActive: true,
    });

    const productWithVariants = product.toObject();

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

/**
 * Update product with variants (nested update)
 */
export const updateProduct = async (
    productId,
    productUpdates,
    imageFiles = [],
    deleteImagePublicIds = [],
    variants = undefined,
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

        // Validate variants array if explicitly provided as empty array
        if (
            variants !== undefined &&
            variants !== null &&
            Array.isArray(variants) &&
            variants.length === 0
        ) {
            throw new Error(
                "Variants array cannot be empty. Omit the parameter if not updating variants."
            );
        }

        // Find product
        const product = await Product.findById(productId).session(localSession);
        if (!product) {
            throw new Error(`Product not found with ID: ${productId}`);
        }

        // Get category for SKU generation and validate if changing
        const categoryId = productUpdates.category || product.category;
        const category = await Category.findById(categoryId).session(
            localSession
        );

        if (!category) {
            throw new Error(`Category not found with ID: ${categoryId}`);
        }

        // Update slug if name changed
        if (productUpdates.name && productUpdates.name !== product.name) {
            productUpdates.slug = await generateSlug(productUpdates.name);
        }

        // Handle image deletions
        if (deleteImagePublicIds && deleteImagePublicIds.length > 0) {
            // Ensure we're not deleting all images
            const remainingImages = product.images.filter(
                (img) => !deleteImagePublicIds.includes(img.publicId)
            );
            const newImagesCount = imageFiles?.length || 0;

            if (remainingImages.length === 0 && newImagesCount === 0) {
                throw new Error(
                    "Cannot delete all images. Product must have at least one image."
                );
            }

            // Delete from Cloudinary
            await deleteMultipleImages(deleteImagePublicIds);

            // Remove from product
            product.images = remainingImages;
        }

        // Handle new image uploads
        if (imageFiles && imageFiles.length > 0) {
            const slugBase =
                productUpdates.slug ||
                product.slug ||
                product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            const imageBuffers = imageFiles.map((file) => file.buffer);
            const uploadedImages = await uploadMultipleImages(
                imageBuffers,
                "products",
                `prod_${slugBase}`
            );

            // Format and add new images
            const newImages = uploadedImages.map((img, index) => ({
                publicId: img.publicId,
                url: img.secureUrl,
                alt: productUpdates.name || product.name,
                sortOrder: (product.images?.length || 0) + index,
                isPrimary: (product.images?.length || 0) === 0 && index === 0,
            }));

            product.images = [...(product.images || []), ...newImages];
        }

        // Re-adjust sortOrder and ensure one image is primary
        if (product.images && product.images.length > 0) {
            product.images = product.images.map((img, index) => ({
                ...img,
                sortOrder: index,
                isPrimary: index === 0,
            }));
        }

        // Update product
        productUpdates.updatedBy = adminId;
        Object.assign(product, productUpdates);
        await product.save({ session: localSession });

        // Process variants (only if variants are provided)
        const updatedVariants = [];

        if (variants && Array.isArray(variants) && variants.length > 0) {
            // Handle variant updates and creates
            for (let i = 0; i < variants.length; i++) {
                const variantData = variants[i];

                // Validate attributes
                if (
                    variantData.attributes &&
                    variantData.attributes.length > 0
                ) {
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

                    const [variant] = await ProductVariant.create(
                        [variantData],
                        {
                            session: localSession,
                        }
                    );
                    updatedVariants.push(variant);
                }
            }
        }

        // Delete variants (and their images from Cloudinary)
        let deletedVariantImageIds = [];
        if (deleteVariantIds && deleteVariantIds.length > 0) {
            // Get variants to be deleted to extract their image publicIds
            const variantsToDelete = await ProductVariant.find({
                _id: { $in: deleteVariantIds },
                product: productId,
            }).session(localSession);

            // Collect all image publicIds from variants to be deleted
            variantsToDelete.forEach((variant) => {
                if (variant.images && variant.images.length > 0) {
                    variant.images.forEach((img) => {
                        if (img.publicId) {
                            deletedVariantImageIds.push(img.publicId);
                        }
                    });
                }
            });

            // Delete variants from database
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

        // Delete variant images from Cloudinary (after transaction commits)
        if (deletedVariantImageIds.length > 0) {
            try {
                await deleteMultipleImages(deletedVariantImageIds);
            } catch (imgError) {
                logger.error(
                    "Failed to delete variant images from Cloudinary:",
                    imgError.message
                );
            }
        }

        // Get all current variants for response
        const allVariants = await ProductVariant.find({
            product: productId,
            isActive: true,
        });

        const productWithVariants = product.toObject();

        // Generate URLs for product images
        if (
            productWithVariants.images &&
            productWithVariants.images.length > 0
        ) {
            productWithVariants.images = productWithVariants.images.map(
                (img) => ({
                    ...img,
                    urls: getImageVariants(img.publicId),
                })
            );
        }

        // Generate URLs for variant images and sort
        productWithVariants.variants = sortVariants(allVariants).map(
            (variant) => {
                const variantObj = variant.toObject
                    ? variant.toObject()
                    : variant;
                if (variantObj.images && variantObj.images.length > 0) {
                    variantObj.images = variantObj.images.map((img) => ({
                        ...img,
                        urls: getImageVariants(img.publicId),
                    }));
                }
                return variantObj;
            }
        );

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
        throw new Error(`Product not found with ID: ${productId}`);
    }

    // Check if already inactive
    if (!product.isActive) {
        throw new Error("Product is already inactive");
    }

    // Deactivate product with timestamp update
    product.isActive = false;
    product.updatedBy = adminId;
    product.updatedAt = new Date();
    await product.save();

    // Deactivate all variants with timestamp update
    await ProductVariant.updateMany(
        { product: productId },
        {
            isActive: false,
            updatedBy: adminId,
            updatedAt: new Date(),
        }
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
            throw new Error(`Product not found with ID: ${productId}`);
        }

        // Get all variants to delete their images
        const variants = await ProductVariant.find({
            product: productId,
        }).session(localSession);

        // Collect all image publicIds for deletion
        const imagePublicIds = [];

        // Add product images
        if (product.images && product.images.length > 0) {
            product.images.forEach((img) => {
                if (img.publicId) {
                    imagePublicIds.push(img.publicId);
                }
            });
        }

        // Add variant images
        variants.forEach((variant) => {
            if (variant.images && variant.images.length > 0) {
                variant.images.forEach((img) => {
                    if (img.publicId) {
                        imagePublicIds.push(img.publicId);
                    }
                });
            }
        });

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

        // Delete images from Cloudinary (after transaction commits)
        if (imagePublicIds.length > 0) {
            try {
                await deleteMultipleImages(imagePublicIds);
            } catch (imgError) {
                // Log but don't fail the operation
                logger.error(
                    "Failed to delete some images from Cloudinary:",
                    imgError.message
                );
            }
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
export const createVariant = async (
    productId,
    variantData,
    imageFiles,
    adminId
) => {
    const session = await mongoose.startSession();
    let uploadedImagePublicIds = [];

    try {
        session.startTransaction();

        // Validate product exists
        const product = await Product.findById(productId)
            .populate("category")
            .session(session);
        if (!product) {
            throw new Error(`Product not found with ID: ${productId}`);
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
            }).session(session);
            variantData.sku = await generateVariantSKU(
                product.category.name,
                product.name,
                existingVariants.length + 1,
                variantData.attributes || []
            );
        }

        // Handle image uploads
        if (imageFiles && imageFiles.length > 0) {
            const slugBase = variantData.sku;
            const imageBuffers = imageFiles.map((file) => file.buffer);
            try {
                const uploadedImages = await uploadMultipleImages(
                    imageBuffers,
                    "products/variants",
                    slugBase
                );

                // Track uploaded publicIds for cleanup on failure
                uploadedImagePublicIds = uploadedImages.map(
                    (img) => img.publicId
                );

                // Format images for database
                variantData.images = uploadedImages.map((img, index) => ({
                    publicId: img.publicId,
                    url: img.secureUrl,
                    alt: `${product.name} variant`,
                    sortOrder: index,
                    isPrimary: index === 0,
                }));
            } catch (uploadError) {
                throw new Error(`Image upload failed: ${uploadError.message}`);
            }
        }

        // Set product reference
        variantData.product = productId;
        variantData.createdBy = adminId;

        // Create variant
        const variant = await ProductVariant.create([variantData], { session });

        await session.commitTransaction();

        // Generate URLs for variant images
        const variantObj = variant[0].toObject();
        if (variantObj.images && variantObj.images.length > 0) {
            variantObj.images = variantObj.images.map((img) => ({
                ...img,
                urls: getImageVariants(img.publicId),
            }));
        }

        return variantObj;
    } catch (error) {
        await session.abortTransaction();

        // Cleanup uploaded images on failure
        if (uploadedImagePublicIds.length > 0) {
            try {
                await deleteMultipleImages(uploadedImagePublicIds);
            } catch (cleanupError) {
                logger.error(
                    "Failed to cleanup images after variant creation failure:",
                    cleanupError.message
                );
            }
        }

        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Update a single variant
 */
export const updateVariant = async (
    variantId,
    updates,
    imageFiles = [],
    deleteImagePublicIds = [],
    adminId
) => {
    const variant = await ProductVariant.findById(variantId).populate(
        "product"
    );

    if (!variant) {
        throw new Error(`Variant not found with ID: ${variantId}`);
    }

    // Validate attributes if provided
    if (updates.attributes && updates.attributes.length > 0) {
        const attrValidation = validateAttributes(updates.attributes);
        if (!attrValidation.valid) {
            throw new Error(attrValidation.message);
        }
    }

    // Handle image deletions
    if (deleteImagePublicIds && deleteImagePublicIds.length > 0) {
        // Filter out images to delete
        const remainingImages = variant.images.filter(
            (img) => !deleteImagePublicIds.includes(img.publicId)
        );
        const newImagesCount = imageFiles?.length || 0;

        // Allow deleting all variant images (variants can have no images)
        // Delete from Cloudinary
        await deleteMultipleImages(deleteImagePublicIds);

        // Remove from variant
        variant.images = remainingImages;
    }

    // Handle new image uploads
    if (imageFiles && imageFiles.length > 0) {
        const slugBase = variant.sku || `var_${variant._id}`;
        const imageBuffers = imageFiles.map((file) => file.buffer);
        const uploadedImages = await uploadMultipleImages(
            imageBuffers,
            "products/variants",
            slugBase
        );

        // Format and add new images
        const newImages = uploadedImages.map((img, index) => ({
            publicId: img.publicId,
            url: img.secureUrl,
            alt: `${variant.product.name} variant`,
            sortOrder: (variant.images?.length || 0) + index,
            isPrimary: (variant.images?.length || 0) === 0 && index === 0,
        }));

        variant.images = [...(variant.images || []), ...newImages];
    }

    // Re-adjust sortOrder and primary if needed
    if (variant.images && variant.images.length > 0) {
        variant.images = variant.images.map((img, index) => ({
            ...img,
            sortOrder: index,
            isPrimary: index === 0,
        }));
    }

    // Update variant
    updates.updatedBy = adminId;
    Object.assign(variant, updates);
    await variant.save();

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

    // Find the variant first to check if already inactive
    const variant = await ProductVariant.findOne({
        _id: variantId,
        product: productId,
    });

    if (!variant) {
        throw new Error(`Variant not found with ID: ${variantId}`);
    }

    if (!variant.isActive) {
        throw new Error("Variant is already inactive");
    }

    // Deactivate variant with timestamp update
    variant.isActive = false;
    variant.updatedBy = adminId;
    variant.updatedAt = new Date();
    await variant.save();

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

    // Find and delete variant
    const variant = await ProductVariant.findOneAndDelete({
        _id: variantId,
        product: productId,
    });

    if (!variant) {
        throw new Error(`Variant not found with ID: ${variantId}`);
    }

    // Delete variant images from Cloudinary
    if (variant.images && variant.images.length > 0) {
        const imagePublicIds = variant.images
            .filter((img) => img.publicId)
            .map((img) => img.publicId);

        if (imagePublicIds.length > 0) {
            try {
                await deleteMultipleImages(imagePublicIds);
            } catch (imgError) {
                // Log but don't fail the operation
                logger.error(
                    "Failed to delete variant images from Cloudinary:",
                    imgError.message
                );
            }
        }
    }

    return { data: { message: "Variant deleted permanently" } };
};

/**
 * Update variant stock
 */
export const updateVariantStock = async (variantId, stockQuantity) => {
    const variant = await ProductVariant.findById(variantId);

    if (!variant) {
        throw new Error(`Variant not found with ID: ${variantId}`);
    }

    variant.stockQuantity = stockQuantity;
    await variant.save();

    // Return variant with image URLs
    const variantObj = variant.toObject();
    if (variantObj.images && variantObj.images.length > 0) {
        variantObj.images = variantObj.images.map((img) => ({
            ...img,
            urls: getImageVariants(img.publicId),
        }));
    }

    return variantObj;
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

/**
 * Get all variants for a product
 */
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

/**
 * Upload/Add images to product
 */
export const uploadProductImages = async (productId, imageFiles, adminId) => {
    const product = await Product.findById(productId);

    if (!product) {
        throw new Error("Product not found");
    }

    // Upload new images to Cloudinary
    const slugBase =
        product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const imageBuffers = imageFiles.map((file) => file.buffer);
    const uploadedImages = await uploadMultipleImages(
        imageBuffers,
        "products",
        `prod_${slugBase}`
    );

    // Format and add new images to existing images array
    const newImages = uploadedImages.map((img, index) => ({
        publicId: img.publicId,
        url: img.secureUrl,
        alt: product.name,
        sortOrder: (product.images?.length || 0) + index,
        isPrimary: (product.images?.length || 0) === 0 && index === 0,
    }));

    product.images = [...(product.images || []), ...newImages];
    product.updatedBy = adminId;
    await product.save();

    logger.info(`Product images uploaded: ${product.name} by admin ${adminId}`);

    // Return product with image URLs
    const updatedProduct = product.toObject();
    if (updatedProduct.images && updatedProduct.images.length > 0) {
        updatedProduct.images = updatedProduct.images.map((img) => ({
            ...img,
            urls: getImageVariants(img.publicId),
        }));
    }

    return updatedProduct;
};

/**
 * Delete specific images from product
 */
export const deleteProductImages = async (productId, publicIds, adminId) => {
    const product = await Product.findById(productId);

    if (!product) {
        throw new Error("Product not found");
    }

    if (!product.images || product.images.length === 0) {
        throw new Error("Product has no images");
    }

    // Filter out images to delete
    const imagesToDelete = product.images.filter((img) =>
        publicIds.includes(img.publicId)
    );

    if (imagesToDelete.length === 0) {
        throw new Error("No matching images found");
    }

    // Don't allow deleting all images
    if (imagesToDelete.length === product.images.length) {
        throw new Error(
            "Cannot delete all images. Product must have at least one image."
        );
    }

    // Delete from Cloudinary
    await deleteMultipleImages(publicIds);

    // Remove from product
    product.images = product.images.filter(
        (img) => !publicIds.includes(img.publicId)
    );

    // Re-adjust sortOrder and ensure one image is primary
    product.images = product.images.map((img, index) => ({
        ...img,
        sortOrder: index,
        isPrimary: index === 0,
    }));

    product.updatedBy = adminId;
    await product.save();

    logger.info(
        `Product images deleted: ${publicIds.join(", ")} by admin ${adminId}`
    );

    // Return product with image URLs
    const updatedProduct = product.toObject();
    if (updatedProduct.images && updatedProduct.images.length > 0) {
        updatedProduct.images = updatedProduct.images.map((img) => ({
            ...img,
            urls: getImageVariants(img.publicId),
        }));
    }

    return updatedProduct;
};

/**
 * Upload/Add images to variant
 */
export const uploadVariantImages = async (variantId, imageFiles, adminId) => {
    const variant = await ProductVariant.findById(variantId).populate(
        "product"
    );

    if (!variant) {
        throw new Error("Variant not found");
    }

    // Upload new images to Cloudinary
    const slugBase = variant.sku || `var_${variant._id}`;
    const imageBuffers = imageFiles.map((file) => file.buffer);
    const uploadedImages = await uploadMultipleImages(
        imageBuffers,
        "products/variants",
        slugBase
    );

    // Format and add new images
    const newImages = uploadedImages.map((img, index) => ({
        publicId: img.publicId,
        url: img.secureUrl,
        alt: `${variant.product.name} variant`,
        sortOrder: (variant.images?.length || 0) + index,
        isPrimary: (variant.images?.length || 0) === 0 && index === 0,
    }));

    variant.images = [...(variant.images || []), ...newImages];
    variant.updatedBy = adminId;
    await variant.save();

    logger.info(`Variant images uploaded: ${variant.sku} by admin ${adminId}`);

    // Return variant with image URLs
    const updatedVariant = variant.toObject();
    if (updatedVariant.images && updatedVariant.images.length > 0) {
        updatedVariant.images = updatedVariant.images.map((img) => ({
            ...img,
            urls: getImageVariants(img.publicId),
        }));
    }

    return updatedVariant;
};

/**
 * Delete specific images from variant
 */
export const deleteVariantImages = async (variantId, publicIds, adminId) => {
    const variant = await ProductVariant.findById(variantId);

    if (!variant) {
        throw new Error("Variant not found");
    }

    if (!variant.images || variant.images.length === 0) {
        throw new Error("Variant has no images");
    }

    // Filter out images to delete
    const imagesToDelete = variant.images.filter((img) =>
        publicIds.includes(img.publicId)
    );

    if (imagesToDelete.length === 0) {
        throw new Error("No matching images found");
    }

    // Delete from Cloudinary
    await deleteMultipleImages(publicIds);

    // Remove from variant
    variant.images = variant.images.filter(
        (img) => !publicIds.includes(img.publicId)
    );

    // Re-adjust sortOrder and primary if needed
    if (variant.images.length > 0) {
        variant.images = variant.images.map((img, index) => ({
            ...img,
            sortOrder: index,
            isPrimary: index === 0,
        }));
    }

    variant.updatedBy = adminId;
    await variant.save();

    logger.info(
        `Variant images deleted: ${publicIds.join(", ")} by admin ${adminId}`
    );

    // Return variant with image URLs
    const updatedVariant = variant.toObject();
    if (updatedVariant.images && updatedVariant.images.length > 0) {
        updatedVariant.images = updatedVariant.images.map((img) => ({
            ...img,
            urls: getImageVariants(img.publicId),
        }));
    }

    return updatedVariant;
};
