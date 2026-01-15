import mongoose from "mongoose";
import Product from "../../products/product.model.js";
import ProductVariant from "../../products/product-variant.model.js";
import Category from "../../categories/category.model.js";
import {
    mapProductToSchema,
    mapVariantToSchema,
} from "../utils/mapper.util.js";
import {
    generateVariantSKU,
    generateSlug,
} from "../../products/product.util.js";
import logger from "../../../shared/utils/logger.util.js";

/**
 * Import products and variants with transaction support
 * Note: ProductVariant is a separate collection, not embedded in Product
 */
export const importProducts = async (
    parsedProducts,
    parsedVariants,
    adminId
) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        logger.info(
            `Starting import: ${parsedProducts.length} products, ${parsedVariants.length} variants`
        );

        const stats = {
            products: {
                created: 0,
                updated: 0,
            },
            variants: {
                created: 0,
                updated: 0,
            },
        };

        // Fetch all categories and subcategories once
        const [categories, subcategories] = await Promise.all([
            Category.find({ isActive: true, parent: null })
                .select("_id name")
                .lean(),
            Category.find({ isActive: true, parent: { $ne: null } })
                .select("_id name")
                .lean(),
        ]);

        // Create maps for quick lookup
        const categoryMap = new Map(
            categories.map((cat) => [cat.name.toLowerCase(), cat._id])
        );
        const subcategoryMap = new Map(
            subcategories.map((sub) => [sub.name.toLowerCase(), sub._id])
        );

        // Map to store product name -> MongoDB _id
        const productIdMap = new Map();

        // ===== STEP 1: Process Products =====
        for (const parsedProduct of parsedProducts) {
            try {
                const categoryId = categoryMap.get(
                    parsedProduct.category.toLowerCase()
                );
                const subcategoryId = parsedProduct.subcategory
                    ? subcategoryMap.get(
                          parsedProduct.subcategory.toLowerCase()
                      )
                    : null;

                if (!categoryId) {
                    throw new Error(
                        `Category not found: ${parsedProduct.category}`
                    );
                }

                const productData = mapProductToSchema(
                    parsedProduct,
                    categoryId,
                    subcategoryId,
                    parsedProduct._action
                );

                if (parsedProduct._action === "CREATE") {
                    // Add createdBy and images (empty array for bulk)
                    productData.createdBy = adminId;
                    productData.images = []; // Images not supported in bulk operations

                    // Auto-generate slug if not provided (maintain consistency with regular product API)
                    if (!productData.slug) {
                        productData.slug = await generateSlug(
                            parsedProduct.product_name
                        );
                    }

                    // Create new product with validateBeforeSave:false to skip images validation
                    const [newProduct] = await Product.create([productData], {
                        session,
                        validateBeforeSave: false, // Skip validation to allow empty images array
                    });
                    stats.products.created++;

                    // Store the new product ID for variant linking
                    productIdMap.set(
                        parsedProduct.product_name,
                        newProduct._id
                    );

                    logger.info(
                        `Created product: ${parsedProduct.product_name} (ID: ${newProduct._id})`
                    );
                } else if (parsedProduct._action === "UPDATE") {
                    // Update existing product
                    productData.updatedBy = adminId;

                    const updatedProduct = await Product.findByIdAndUpdate(
                        parsedProduct.product_id,
                        productData,
                        {
                            session,
                            new: true,
                            runValidators: true,
                        }
                    );

                    if (!updatedProduct) {
                        throw new Error(
                            `Product not found for update: ${parsedProduct.product_id}`
                        );
                    }

                    stats.products.updated++;

                    // Store the product ID for variant linking
                    productIdMap.set(
                        parsedProduct.product_name,
                        updatedProduct._id
                    );

                    logger.info(
                        `Updated product: ${parsedProduct.product_name}`
                    );
                }
            } catch (error) {
                logger.error(
                    `Error processing product ${parsedProduct.product_name}:`,
                    error
                );
                throw error;
            }
        }

        // ===== STEP 2: Process Variants =====
        for (const parsedVariant of parsedVariants) {
            try {
                // Get the product ID from the map (for products in current import)
                let productId = productIdMap.get(parsedVariant.product_name);

                // If not in map, find existing product by name
                if (!productId) {
                    const existingProduct = await Product.findOne({
                        name: parsedVariant.product_name,
                    }).session(session);
                    if (!existingProduct) {
                        throw new Error(
                            `Product not found for variant: ${parsedVariant.product_name}`
                        );
                    }
                    productId = existingProduct._id;
                }

                const variantData = mapVariantToSchema(
                    parsedVariant,
                    parsedVariant._action
                );

                if (parsedVariant._action === "CREATE") {
                    // Create new variant in separate ProductVariant collection
                    variantData.product = productId;
                    variantData.createdBy = adminId;

                    // Generate SKU if not provided
                    if (!variantData.sku) {
                        const product = await Product.findById(productId)
                            .populate("category", "name")
                            .session(session);

                        // Count existing variants for this product
                        const variantCount =
                            await ProductVariant.countDocuments({
                                product: productId,
                            }).session(session);
                        const variantIndex = variantCount + 1;

                        variantData.sku = await generateVariantSKU(
                            product.category.name,
                            product.name,
                            variantIndex,
                            variantData.attributes || []
                        );
                    }

                    // Create variant as separate document
                    await ProductVariant.create([variantData], { session });
                    stats.variants.created++;

                    logger.info(
                        `Created variant ${variantData.sku} for product: ${parsedVariant.product_name}`
                    );
                } else if (parsedVariant._action === "UPDATE") {
                    // Update existing variant by SKU
                    variantData.updatedBy = adminId;

                    const updatedVariant =
                        await ProductVariant.findOneAndUpdate(
                            { sku: parsedVariant.sku, product: productId },
                            variantData,
                            {
                                session,
                                new: true,
                                runValidators: true,
                            }
                        );

                    if (!updatedVariant) {
                        throw new Error(
                            `Variant not found for update: ${parsedVariant.sku}`
                        );
                    }

                    stats.variants.updated++;

                    logger.info(
                        `Updated variant ${parsedVariant.sku} for product: ${parsedVariant.product_name}`
                    );
                }
            } catch (error) {
                logger.error(
                    `Error processing variant for product ${parsedVariant.product_name}:`,
                    error
                );
                throw error;
            }
        }

        // Commit transaction
        await session.commitTransaction();
        logger.info("Import completed successfully:", stats);

        return stats;
    } catch (error) {
        // Rollback transaction on error
        await session.abortTransaction();
        logger.error("Import failed, transaction rolled back:", error);
        throw error;
    } finally {
        session.endSession();
    }
};

export default {
    importProducts,
};
