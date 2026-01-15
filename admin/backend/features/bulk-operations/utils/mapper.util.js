import logger from "../../../shared/utils/logger.util.js";

/**
 * Map Excel product data to MongoDB Product schema
 * Based on actual Product model structure
 * @param {Object} parsedProduct - Parsed product data from Excel
 * @param {String} categoryId - Category ObjectId
 * @param {String} subcategoryId - Subcategory ObjectId
 * @param {String} action - 'CREATE' or 'UPDATE'
 * @returns {Object} Mapped product data for MongoDB
 */
export const mapProductToSchema = (
    parsedProduct,
    categoryId,
    subcategoryId,
    action = "CREATE"
) => {
    try {
        const mapped = {};

        // For UPDATE: Only include non-empty fields (partial update)
        // For CREATE: Include all fields with defaults
        if (action === "UPDATE") {
            // Only add fields that have actual values (not null, undefined, or empty string)
            if (parsedProduct.product_name)
                mapped.name = parsedProduct.product_name;
            if (parsedProduct.slug) mapped.slug = parsedProduct.slug;
            if (categoryId) mapped.category = categoryId;
            if (subcategoryId) mapped.subcategory = subcategoryId;
            if (parsedProduct.description)
                mapped.description = parsedProduct.description;
            if (parsedProduct.short_description)
                mapped.shortDescription = parsedProduct.short_description;
            if (parsedProduct.purity) mapped.purity = parsedProduct.purity;
            if (
                parsedProduct.making_charges_per_gram !== undefined &&
                parsedProduct.making_charges_per_gram !== null &&
                parsedProduct.making_charges_per_gram !== ""
            ) {
                mapped.makingChargesPerGram =
                    parsedProduct.making_charges_per_gram;
            }
            if (
                parsedProduct.gst_rate !== undefined &&
                parsedProduct.gst_rate !== null &&
                parsedProduct.gst_rate !== ""
            ) {
                mapped.gstRate = parsedProduct.gst_rate;
            }
            if (
                parsedProduct.collections &&
                Array.isArray(parsedProduct.collections) &&
                parsedProduct.collections.length > 0
            ) {
                mapped.collections = parsedProduct.collections;
            }
            if (
                parsedProduct.is_featured !== undefined &&
                parsedProduct.is_featured !== null &&
                parsedProduct.is_featured !== ""
            ) {
                mapped.isFeatured = parsedProduct.is_featured;
            }
            if (
                parsedProduct.is_active !== undefined &&
                parsedProduct.is_active !== null &&
                parsedProduct.is_active !== ""
            ) {
                mapped.isActive = parsedProduct.is_active;
            }
            if (
                parsedProduct.tags &&
                Array.isArray(parsedProduct.tags) &&
                parsedProduct.tags.length > 0
            ) {
                mapped.tags = parsedProduct.tags;
            }

            // Nested objects - only update if any sub-field has value
            const hallmark = {};
            if (
                parsedProduct.is_hallmarked !== undefined &&
                parsedProduct.is_hallmarked !== null &&
                parsedProduct.is_hallmarked !== ""
            ) {
                hallmark.isHallmarked = parsedProduct.is_hallmarked;
            }
            if (parsedProduct.bis_license_number)
                hallmark.bisLicenseNumber = parsedProduct.bis_license_number;
            if (parsedProduct.hallmarking_center)
                hallmark.hallmarkingCenter = parsedProduct.hallmarking_center;
            if (parsedProduct.purity_certified)
                hallmark.purityCertified = parsedProduct.purity_certified;
            if (Object.keys(hallmark).length > 0) mapped.hallmark = hallmark;

            const attributes = {};
            if (parsedProduct.gemstone)
                attributes.gemstone = parsedProduct.gemstone;
            if (parsedProduct.occasion)
                attributes.occasion = parsedProduct.occasion;
            if (parsedProduct.gender) attributes.gender = parsedProduct.gender;
            if (parsedProduct.plating)
                attributes.plating = parsedProduct.plating;
            if (Object.keys(attributes).length > 0)
                mapped.attributes = attributes;

            const seo = {};
            if (parsedProduct.meta_title)
                seo.metaTitle = parsedProduct.meta_title;
            if (parsedProduct.meta_description)
                seo.metaDescription = parsedProduct.meta_description;
            if (
                parsedProduct.meta_keywords &&
                Array.isArray(parsedProduct.meta_keywords) &&
                parsedProduct.meta_keywords.length > 0
            ) {
                seo.metaKeywords = parsedProduct.meta_keywords;
            }
            if (Object.keys(seo).length > 0) mapped.seo = seo;
        } else {
            // CREATE: Include all fields with defaults
            mapped.name = parsedProduct.product_name;
            mapped.slug = parsedProduct.slug || null; // Will be auto-generated if null
            mapped.category = categoryId;
            mapped.subcategory = subcategoryId || null;
            mapped.description = parsedProduct.description || "";
            mapped.shortDescription = parsedProduct.short_description || "";
            mapped.purity = parsedProduct.purity; // Required: "925" or "999"
            mapped.makingChargesPerGram = parsedProduct.making_charges_per_gram; // Required
            mapped.gstRate = parsedProduct.gst_rate || 3; // Default 3%
            mapped.collections = Array.isArray(parsedProduct.collections)
                ? parsedProduct.collections
                : [];
            mapped.isFeatured = parsedProduct.is_featured || false;
            mapped.isActive = parsedProduct.is_active !== false; // Default true
            mapped.tags = Array.isArray(parsedProduct.tags)
                ? parsedProduct.tags
                : [];
            mapped.hallmark = {
                isHallmarked: parsedProduct.is_hallmarked || false,
                bisLicenseNumber: parsedProduct.bis_license_number || "",
                hallmarkingCenter: parsedProduct.hallmarking_center || "",
                purityCertified: parsedProduct.purity_certified || "",
            };
            mapped.attributes = {
                gemstone: parsedProduct.gemstone || "",
                occasion: parsedProduct.occasion || "",
                gender: parsedProduct.gender || "",
                plating: parsedProduct.plating || "",
            };
            mapped.seo = {
                metaTitle: parsedProduct.meta_title || "",
                metaDescription: parsedProduct.meta_description || "",
                metaKeywords: Array.isArray(parsedProduct.meta_keywords)
                    ? parsedProduct.meta_keywords
                    : [],
            };
        }

        return mapped;
    } catch (error) {
        logger.error("Error mapping product to schema:", error);
        throw error;
    }
};

/**
 * Map Excel variant data to MongoDB ProductVariant schema
 * Based on actual ProductVariant model structure
 * @param {Object} parsedVariant - Parsed variant data from Excel
 * @param {String} action - 'CREATE' or 'UPDATE'
 * @returns {Object} Mapped variant data for MongoDB
 */
export const mapVariantToSchema = (parsedVariant, action = "CREATE") => {
    try {
        const mapped = {};

        // For UPDATE: Only include non-empty fields (partial update)
        // For CREATE: Include all fields with defaults
        if (action === "UPDATE") {
            // Only add fields that have actual values
            if (parsedVariant.sku) mapped.sku = parsedVariant.sku;
            if (parsedVariant.variant_name)
                mapped.variantName = parsedVariant.variant_name;
            if (parsedVariant.attributes) {
                mapped.attributes = parsedVariant.attributes
                    .split(";")
                    .map((attr) => {
                        const [key, value] = attr
                            .split(":")
                            .map((s) => s.trim());
                        return { key, value };
                    });
            }
            if (
                parsedVariant.weight !== undefined &&
                parsedVariant.weight !== null &&
                parsedVariant.weight !== ""
            ) {
                mapped.weight = parsedVariant.weight;
            }

            // Dimensions - only update if any sub-field has value
            const dimensions = {};
            if (
                parsedVariant.length !== undefined &&
                parsedVariant.length !== null &&
                parsedVariant.length !== ""
            ) {
                dimensions.length = parsedVariant.length;
            }
            if (
                parsedVariant.width !== undefined &&
                parsedVariant.width !== null &&
                parsedVariant.width !== ""
            ) {
                dimensions.width = parsedVariant.width;
            }
            if (
                parsedVariant.height !== undefined &&
                parsedVariant.height !== null &&
                parsedVariant.height !== ""
            ) {
                dimensions.height = parsedVariant.height;
            }
            if (Object.keys(dimensions).length > 0)
                mapped.dimensions = dimensions;

            if (
                parsedVariant.mrp !== undefined &&
                parsedVariant.mrp !== null &&
                parsedVariant.mrp !== ""
            ) {
                mapped.mrp = parsedVariant.mrp;
            }
            if (
                parsedVariant.selling_price !== undefined &&
                parsedVariant.selling_price !== null &&
                parsedVariant.selling_price !== ""
            ) {
                mapped.sellingPrice = parsedVariant.selling_price;
            }
            if (
                parsedVariant.cost_price !== undefined &&
                parsedVariant.cost_price !== null &&
                parsedVariant.cost_price !== ""
            ) {
                mapped.costPrice = parsedVariant.cost_price;
            }
            if (
                parsedVariant.stock_quantity !== undefined &&
                parsedVariant.stock_quantity !== null &&
                parsedVariant.stock_quantity !== ""
            ) {
                mapped.stockQuantity = parsedVariant.stock_quantity;
            }
            if (
                parsedVariant.low_stock_threshold !== undefined &&
                parsedVariant.low_stock_threshold !== null &&
                parsedVariant.low_stock_threshold !== ""
            ) {
                mapped.lowStockThreshold = parsedVariant.low_stock_threshold;
            }
            if (
                parsedVariant.sort_order !== undefined &&
                parsedVariant.sort_order !== null &&
                parsedVariant.sort_order !== ""
            ) {
                mapped.sortOrder = parsedVariant.sort_order;
            }
            if (
                parsedVariant.is_active !== undefined &&
                parsedVariant.is_active !== null &&
                parsedVariant.is_active !== ""
            ) {
                mapped.isActive = parsedVariant.is_active;
            }
        } else {
            // CREATE: Include all fields with defaults
            mapped.sku = parsedVariant.sku || null; // Will be auto-generated if null for CREATE
            mapped.variantName = parsedVariant.variant_name;
            mapped.attributes = parsedVariant.attributes
                ? parsedVariant.attributes.split(";").map((attr) => {
                      const [key, value] = attr.split(":").map((s) => s.trim());
                      return { key, value };
                  })
                : [];
            mapped.weight = parsedVariant.weight; // Required in grams
            mapped.dimensions = {
                length: parsedVariant.length || null,
                width: parsedVariant.width || null,
                height: parsedVariant.height || null,
            };
            mapped.mrp = parsedVariant.mrp || null;
            mapped.sellingPrice = parsedVariant.selling_price; // Required
            mapped.costPrice = parsedVariant.cost_price || null;
            mapped.stockQuantity = parsedVariant.stock_quantity || 0;
            mapped.lowStockThreshold = parsedVariant.low_stock_threshold || 5;
            mapped.sortOrder = parsedVariant.sort_order || 999;
            mapped.isActive = parsedVariant.is_active !== false; // Default true
        }

        return mapped;
    } catch (error) {
        logger.error("Error mapping variant to schema:", error);
        throw error;
    }
};

/**
 * Map MongoDB Product to Excel format for export
 */
export const mapProductToExcel = (product, categoryMap, subcategoryMap) => {
    try {
        // Handle populated category (object with _id and name) or just ObjectId
        const categoryId = product.category?._id
            ? product.category._id.toString()
            : product.category?.toString();
        const subcategoryId = product.subcategory?._id
            ? product.subcategory._id.toString()
            : product.subcategory?.toString();

        const categoryName =
            product.category?.name || categoryMap.get(categoryId) || "";
        const subcategoryName =
            product.subcategory?.name ||
            subcategoryMap.get(subcategoryId) ||
            "";

        return {
            _action: "UPDATE",
            product_id: product._id.toString(),
            product_name: product.name || "",
            slug: product.slug || "",
            category: categoryName,
            subcategory: subcategoryName,
            description: product.description || "",
            short_description: product.shortDescription || "",
            purity: product.purity || "",
            making_charges_per_gram: product.makingChargesPerGram || 0,
            gst_rate: product.gstRate || 3,
            collections: product.collections?.join(", ") || "",
            is_featured: product.isFeatured ? "TRUE" : "FALSE",
            is_active: product.isActive ? "TRUE" : "FALSE",
            tags: product.tags?.join(", ") || "",
            is_hallmarked: product.hallmark?.isHallmarked ? "TRUE" : "FALSE",
            bis_license_number: product.hallmark?.bisLicenseNumber || "",
            hallmarking_center: product.hallmark?.hallmarkingCenter || "",
            purity_certified: product.hallmark?.purityCertified || "",
            gemstone: product.attributes?.gemstone || "",
            occasion: product.attributes?.occasion || "",
            gender: product.attributes?.gender || "",
            plating: product.attributes?.plating || "",
            meta_title: product.seo?.metaTitle || "",
            meta_description: product.seo?.metaDescription || "",
            meta_keywords: product.seo?.metaKeywords?.join(", ") || "",
        };
    } catch (error) {
        logger.error("Error mapping product to Excel:", error);
        throw error;
    }
};

/**
 * Map MongoDB ProductVariant to Excel format for export
 */
export const mapVariantToExcel = (variant, productName) => {
    try {
        // Format attributes as semicolon-separated key:value pairs
        const attributesStr = variant.attributes
            ? variant.attributes
                  .map((attr) => `${attr.key}:${attr.value}`)
                  .join("; ")
            : "";

        return {
            _action: "UPDATE",
            product_name: productName,
            sku: variant.sku || "",
            variant_name: variant.variantName || "",
            attributes: attributesStr,
            weight: variant.weight || 0,
            length: variant.dimensions?.length || "",
            width: variant.dimensions?.width || "",
            height: variant.dimensions?.height || "",
            mrp: variant.mrp || "",
            selling_price: variant.sellingPrice || 0,
            cost_price: variant.costPrice || "",
            stock_quantity: variant.stockQuantity || 0,
            low_stock_threshold: variant.lowStockThreshold || 5,
            sort_order: variant.sortOrder || 999,
            is_active: variant.isActive ? "TRUE" : "FALSE",
        };
    } catch (error) {
        logger.error("Error mapping variant to Excel:", error);
        throw error;
    }
};

export default {
    mapProductToSchema,
    mapVariantToSchema,
    mapProductToExcel,
    mapVariantToExcel,
};
