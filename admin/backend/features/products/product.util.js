import mongoose from "mongoose";
import Product from "./product.model.js";
import ProductVariant from "./product-variant.model.js";
import { isValidObjectId } from "../../shared/utils/objectid.util.js";

/**
 * Generate a unique SKU for a product variant
 * Format: SS-{CATEGORY}-{PRODUCT}-{NUMBER}-{VARIANT}
 * Example: SS-RING-LOTUS-001-S7
 */
export const generateVariantSKU = async (
    categoryName,
    productName,
    variantIndex,
    attributes,
) => {
    // Clean and format category and product name
    const catCode = categoryName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .substring(0, 10);
    const prodCode = productName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .substring(0, 10);

    // Generate variant code from attributes (e.g., S7 for Size:7, or C-RED for Color:Red)
    let variantCode = "";
    if (attributes && attributes.length > 0) {
        attributes.forEach((attr) => {
            const key = attr.key.substring(0, 1).toUpperCase();
            const value = attr.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
            variantCode += `-${key}${value}`;
        });
    } else {
        variantCode = `-V${variantIndex}`;
    }

    // Pad variant index to 3 digits
    const paddedIndex = String(variantIndex).padStart(3, "0");

    // Generate SKU
    const baseSKU = `SS-${catCode}-${prodCode}-${paddedIndex}${variantCode}`;

    // Ensure uniqueness
    let sku = baseSKU;
    let counter = 1;
    while (await ProductVariant.findOne({ sku })) {
        sku = `${baseSKU}-${counter}`;
        counter++;
    }

    return sku;
};

/**
 * Generate a unique slug for a product
 */
export const generateSlug = async (name) => {
    // Custom slugify implementation
    const baseSlug = name
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-") // Replace spaces with -
        .replace(/[^\w\-]+/g, "") // Remove all non-word chars
        .replace(/\-\-+/g, "-") // Replace multiple - with single -
        .replace(/^-+/, "") // Trim - from start
        .replace(/-+$/, ""); // Trim - from end

    // Ensure uniqueness
    let slug = baseSlug;
    let counter = 1;
    while (await Product.findOne({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return slug;
};

/**
 * Validate attributes array
 */
export const validateAttributes = (attributes) => {
    if (!Array.isArray(attributes)) {
        return { valid: false, message: "Attributes must be an array" };
    }

    for (const attr of attributes) {
        if (!attr.key || !attr.value) {
            return {
                valid: false,
                message: "Each attribute must have both key and value",
            };
        }
        if (typeof attr.key !== "string" || typeof attr.value !== "string") {
            return {
                valid: false,
                message: "Attribute key and value must be strings",
            };
        }
    }

    return { valid: true };
};

/**
 * Sort variants intelligently based on attributes
 */
export const sortVariants = (variants, sortBy = "sortOrder") => {
    if (!Array.isArray(variants) || variants.length === 0) {
        return variants;
    }

    return variants.sort((a, b) => {
        if (sortBy === "sortOrder") {
            return a.sortOrder - b.sortOrder;
        } else if (sortBy === "price") {
            return a.sellingPrice - b.sellingPrice;
        } else if (sortBy === "stock") {
            return b.stockQuantity - a.stockQuantity;
        } else if (sortBy === "size") {
            const sizeA = a.getAttributeValue?.("size") || "0";
            const sizeB = b.getAttributeValue?.("size") || "0";
            return parseFloat(sizeA) - parseFloat(sizeB);
        }
        return 0;
    });
};

/**
 * Calculate price for a variant based on weight and product settings
 */
export const calculateVariantPrice = (
    weight,
    makingChargesPerGram,
    silverRate,
    gstRate,
    gemstoneCharges = 0,
    beautifyStrategy = "99",
) => {
    // Metal value = weight * silverRate
    const metalValue = weight * silverRate;

    // Making charges = weight * makingChargesPerGram
    const makingCharges = weight * makingChargesPerGram;

    // Subtotal before GST
    const subtotal = metalValue + makingCharges + gemstoneCharges;

    // GST calculation
    const gstAmount = (subtotal * gstRate) / 100;

    // Calculated total
    const calculatedTotal = subtotal + gstAmount;

    // Beautify price
    const beautifiedPrice = beautifyPrice(calculatedTotal, beautifyStrategy);

    return {
        metalRate: parseFloat(silverRate.toFixed(2)),
        weight: parseFloat(weight.toFixed(2)),
        metalValue: parseFloat(metalValue.toFixed(2)),
        makingChargesPerGram: parseFloat(makingChargesPerGram.toFixed(2)),
        makingCharges: parseFloat(makingCharges.toFixed(2)),
        gemstoneCharges: parseFloat(gemstoneCharges.toFixed(2)),
        subtotal: parseFloat(subtotal.toFixed(2)),
        gstRate: parseFloat(gstRate.toFixed(2)),
        gstAmount: parseFloat(gstAmount.toFixed(2)),
        calculatedTotal: parseFloat(calculatedTotal.toFixed(2)),
        beautifiedPrice: parseFloat(beautifiedPrice.toFixed(2)),
        calculatedAt: new Date(),
    };
};

/**
 * Beautify price for psychological pricing (₹3999, ₹4299, etc.)
 */
export const beautifyPrice = (rawPrice, strategy = "99") => {
    const rounded = Math.round(rawPrice);

    switch (strategy) {
        case "99":
            // Round to nearest 100, then -1
            // 3850 → 4000 → 3999
            return Math.ceil(rounded / 100) * 100 - 1;

        case "95":
            // Round to nearest 100, then -5
            // 3850 → 4000 → 3995
            return Math.ceil(rounded / 100) * 100 - 5;

        case "round":
            // Round to nearest 100
            // 3850 → 3900
            return Math.round(rounded / 100) * 100;

        case "none":
        default:
            return rounded;
    }
};

/**
 * Parse form data variants (from FormData JSON string)
 */
export const parseFormDataVariants = (variantsString) => {
    try {
        if (!variantsString) {
            return [];
        }

        const variants = JSON.parse(variantsString);

        if (!Array.isArray(variants)) {
            throw new Error("Variants must be an array");
        }

        return variants;
    } catch (error) {
        throw new Error(`Failed to parse variants: ${error.message}`);
    }
};

/**
 * Build aggregation pipeline for product filtering
 */
export const buildProductFilterPipeline = (filters = {}) => {
    const pipeline = [];

    // Match active products
    const productMatch = { isActive: true };

    if (filters.category) {
        // Convert category to ObjectId if it's a valid string
        productMatch.category = isValidObjectId(filters.category)
            ? new mongoose.Types.ObjectId(filters.category)
            : filters.category;
    }

    if (filters.subcategory) {
        // Convert subcategory to ObjectId if it's a valid string
        productMatch.subcategory = isValidObjectId(filters.subcategory)
            ? new mongoose.Types.ObjectId(filters.subcategory)
            : filters.subcategory;
    }

    if (filters.collections && filters.collections.length > 0) {
        // Convert collection IDs to ObjectIds if they're valid strings
        const collectionIds = filters.collections.map((id) =>
            isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : id,
        );
        productMatch.collections = { $in: collectionIds };
    }

    if (filters.purity) {
        productMatch.purity = filters.purity;
    }

    if (filters.isFeatured !== undefined) {
        productMatch.isFeatured = filters.isFeatured;
    }

    // Filter by product attributes (structured fields)
    if (filters.gender) {
        productMatch["attributes.gender"] = filters.gender;
    }

    if (filters.gemstone) {
        productMatch["attributes.gemstone"] = filters.gemstone;
    }

    if (filters.occasion) {
        productMatch["attributes.occasion"] = filters.occasion;
    }

    if (filters.plating) {
        productMatch["attributes.plating"] = filters.plating;
    }

    if (filters.search) {
        productMatch.name = { $regex: filters.search, $options: "i" };
    }

    pipeline.push({ $match: productMatch });

    // Lookup category
    pipeline.push({
        $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryData",
        },
    });
    pipeline.push({
        $unwind: {
            path: "$categoryData",
            preserveNullAndEmptyArrays: true,
        },
    });

    // Lookup subcategory
    pipeline.push({
        $lookup: {
            from: "categories",
            localField: "subcategory",
            foreignField: "_id",
            as: "subcategoryData",
        },
    });
    pipeline.push({
        $unwind: {
            path: "$subcategoryData",
            preserveNullAndEmptyArrays: true,
        },
    });

    // Lookup variants
    pipeline.push({
        $lookup: {
            from: "productvariants",
            localField: "_id",
            foreignField: "product",
            as: "variants",
        },
    });

    // Filter variants
    const variantMatch = { "variants.isActive": true };

    if (filters.minPrice || filters.maxPrice) {
        variantMatch["variants.sellingPrice"] = {};
        if (filters.minPrice) {
            variantMatch["variants.sellingPrice"].$gte = parseFloat(
                filters.minPrice,
            );
        }
        if (filters.maxPrice) {
            variantMatch["variants.sellingPrice"].$lte = parseFloat(
                filters.maxPrice,
            );
        }
    }

    if (filters.inStock) {
        variantMatch["variants.stockQuantity"] = { $gt: 0 };
    }

    // Filter by variant attributes - at least ONE variant must have ALL specified attributes
    if (filters.attributes && Object.keys(filters.attributes).length > 0) {
        // Build conditions that check if a single variant has all specified attributes
        const attributeConditions = Object.entries(filters.attributes).map(
            ([key, value]) => ({
                key: { $regex: new RegExp(key, "i") },
                value: { $regex: new RegExp(value, "i") },
            }),
        );

        // Use $elemMatch with $and to ensure ONE variant has ALL attributes
        pipeline.push({
            $match: {
                variants: {
                    $elemMatch: {
                        $and: attributeConditions.map((condition) => ({
                            attributes: { $elemMatch: condition },
                        })),
                    },
                },
            },
        });
    }

    // Filter products that have at least one matching variant
    if (Object.keys(variantMatch).length > 0) {
        pipeline.push({
            $match: variantMatch,
        });
    }

    // Add min/max price and total stock, and format category/subcategory to only include essential fields
    pipeline.push({
        $addFields: {
            minPrice: { $min: "$variants.sellingPrice" },
            maxPrice: { $max: "$variants.sellingPrice" },
            totalStock: { $sum: "$variants.stockQuantity" },
            category: {
                $cond: {
                    if: { $ifNull: ["$categoryData", false] },
                    then: {
                        _id: "$categoryData._id",
                        name: "$categoryData.name",
                        slug: "$categoryData.slug",
                    },
                    else: null,
                },
            },
            subcategory: {
                $cond: {
                    if: { $ifNull: ["$subcategoryData", false] },
                    then: {
                        _id: "$subcategoryData._id",
                        name: "$subcategoryData.name",
                        slug: "$subcategoryData.slug",
                    },
                    else: null,
                },
            },
            // Include only essential variant fields
            variants: {
                $map: {
                    input: "$variants",
                    as: "variant",
                    in: {
                        _id: "$$variant._id",
                        variantName: "$$variant.variantName",
                        sku: "$$variant.sku",
                        attributes: "$$variant.attributes",
                        sellingPrice: "$$variant.sellingPrice",
                        stockQuantity: "$$variant.stockQuantity",
                        isActive: "$$variant.isActive",
                    },
                },
            },
        },
    });

    // Remove temporary fields
    pipeline.push({
        $project: {
            categoryData: 0,
            subcategoryData: 0,
        },
    });

    // Sort
    if (filters.sortBy) {
        const sortObj = {};
        switch (filters.sortBy) {
            case "price-asc":
                sortObj.minPrice = 1;
                break;
            case "price-desc":
                sortObj.minPrice = -1;
                break;
            case "newest":
                sortObj.createdAt = -1;
                break;
            case "oldest":
                sortObj.createdAt = 1;
                break;
            case "name-asc":
                sortObj.name = 1;
                break;
            case "name-desc":
                sortObj.name = -1;
                break;
            case "rating":
                sortObj["ratings.average"] = -1;
                break;
            default:
                sortObj.createdAt = -1;
        }
        pipeline.push({ $sort: sortObj });
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }

    return pipeline;
};
