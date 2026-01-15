import logger from "../../../shared/utils/logger.util.js";

/**
 * Parse and clean string value
 */
export const parseString = (value) => {
    if (value === null || value === undefined) return null;
    return value.toString().trim();
};

/**
 * Parse number value
 */
export const parseNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;

    const parsed = Number(value);
    if (isNaN(parsed)) return null;

    return parsed;
};

/**
 * Parse boolean value
 */
export const parseBoolean = (value) => {
    if (value === null || value === undefined || value === "") return null;

    const str = value.toString().toLowerCase().trim();
    if (str === "true" || str === "yes" || str === "1") return true;
    if (str === "false" || str === "no" || str === "0") return false;

    return null;
};

/**
 * Parse array from comma-separated string
 */
export const parseArray = (value) => {
    if (value === null || value === undefined || value === "") return [];

    const str = value.toString().trim();
    if (!str) return [];

    return str
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
};

/**
 * Parse date value
 */
export const parseDate = (value) => {
    if (value === null || value === undefined || value === "") return null;

    // If it's already a Date object
    if (value instanceof Date) return value;

    // Try to parse string
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;

    return date;
};

/**
 * Parse action field
 */
export const parseAction = (value) => {
    if (!value) return null;

    const action = value.toString().toUpperCase().trim();
    if (action === "CREATE" || action === "UPDATE") {
        return action;
    }

    return null;
};

/**
 * Parse status field
 */
export const parseStatus = (value) => {
    if (value === null || value === undefined || value === "") return "active";

    const status = value.toString().toLowerCase().trim();
    const validStatuses = ["active", "inactive", "draft"];

    if (validStatuses.includes(status)) {
        return status;
    }

    return null;
};

/**
 * Parse variant attribute type
 */
export const parseAttributeType = (value) => {
    if (!value) return null;

    const type = value.toString().toLowerCase().trim();
    const validTypes = [
        "color",
        "size",
        "weight",
        "material",
        "style",
        "other",
    ];

    if (validTypes.includes(type)) {
        return type;
    }

    return null;
};

/**
 * Clean and validate product name
 */
export const cleanProductName = (value) => {
    if (!value) return null;

    let cleaned = value.toString().trim();

    // Remove extra spaces
    cleaned = cleaned.replace(/\s+/g, " ");

    // Remove special characters except allowed ones
    cleaned = cleaned.replace(/[^\w\s\-&().,]/g, "");

    return cleaned || null;
};

/**
 * Parse HSN/SAC code
 */
export const parseHsnSac = (value) => {
    if (!value) return null;

    let code = value.toString().trim();

    // Remove non-digit characters
    code = code.replace(/\D/g, "");

    // HSN codes are 4, 6, or 8 digits
    if (code.length < 4 || code.length > 8) return null;

    return code;
};

/**
 * Parse product row from Excel - based on actual Product model
 */
export const parseProductRow = (row) => {
    try {
        return {
            _rowNumber: row._rowNumber,
            _action: parseAction(row._action),
            product_id: parseString(row.product_id),
            product_name: cleanProductName(row.product_name),
            slug: parseString(row.slug),
            category: parseString(row.category),
            subcategory: parseString(row.subcategory),
            description: parseString(row.description),
            short_description: parseString(row.short_description),
            purity: parseString(row.purity), // "925" or "999"
            making_charges_per_gram: parseNumber(row.making_charges_per_gram),
            gst_rate: parseNumber(row.gst_rate),
            collections: parseArray(row.collections),
            is_featured: parseBoolean(row.is_featured),
            is_active: parseBoolean(row.is_active),
            tags: parseArray(row.tags),
            is_hallmarked: parseBoolean(row.is_hallmarked),
            bis_license_number: parseString(row.bis_license_number),
            hallmarking_center: parseString(row.hallmarking_center),
            purity_certified: parseString(row.purity_certified),
            gemstone: parseString(row.gemstone),
            occasion: parseString(row.occasion),
            gender: parseString(row.gender), // "men", "women", "unisex"
            plating: parseString(row.plating),
            meta_title: parseString(row.meta_title),
            meta_description: parseString(row.meta_description),
            meta_keywords: parseArray(row.meta_keywords),
        };
    } catch (error) {
        logger.error(`Error parsing product row ${row._rowNumber}:`, error);
        return null;
    }
};

/**
 * Parse variant row from Excel - based on actual ProductVariant model
 */
export const parseVariantRow = (row) => {
    try {
        return {
            _rowNumber: row._rowNumber,
            _action: parseAction(row._action),
            product_name: cleanProductName(row.product_name),
            sku: parseString(row.sku), // Auto-generated for CREATE
            variant_name: parseString(row.variant_name),
            attributes: parseString(row.attributes), // Format: "key:value; key:value"
            weight: parseNumber(row.weight), // in grams
            length: parseNumber(row.length), // in cm
            width: parseNumber(row.width), // in cm
            height: parseNumber(row.height), // in cm
            mrp: parseNumber(row.mrp),
            selling_price: parseNumber(row.selling_price),
            cost_price: parseNumber(row.cost_price),
            stock_quantity: parseNumber(row.stock_quantity),
            low_stock_threshold: parseNumber(row.low_stock_threshold),
            sort_order: parseNumber(row.sort_order),
            is_active: parseBoolean(row.is_active),
        };
    } catch (error) {
        logger.error(`Error parsing variant row ${row._rowNumber}:`, error);
        return null;
    }
};

/**
 * Group variants by product name
 */
export const groupVariantsByProduct = (variants) => {
    const grouped = {};

    variants.forEach((variant) => {
        const productName = variant.product_name;
        if (!productName) return;

        if (!grouped[productName]) {
            grouped[productName] = [];
        }

        grouped[productName].push(variant);
    });

    return grouped;
};

export default {
    parseString,
    parseNumber,
    parseBoolean,
    parseArray,
    parseDate,
    parseAction,
    parseStatus,
    parseAttributeType,
    cleanProductName,
    parseHsnSac,
    parseProductRow,
    parseVariantRow,
    groupVariantsByProduct,
};
