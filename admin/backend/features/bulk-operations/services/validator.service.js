import Product from "../../products/product.model.js";
import ProductVariant from "../../products/product-variant.model.js";
import Category from "../../categories/category.model.js";
import logger from "../../../shared/utils/logger.util.js";

/**
 * Add error to result
 */
const addError = (
    result,
    row,
    sheet,
    action,
    field,
    message,
    severity = "error"
) => {
    const error = {
        row,
        sheet,
        action,
        productName: result.currentProductName,
        severity,
        errors: [
            {
                field,
                message,
            },
        ],
    };
    result.errors.push(error);
};

/**
 * Validate required field
 */
const validateRequired = (value, fieldName, result, row, sheet, action) => {
    if (value === null || value === undefined || value === "") {
        addError(
            result,
            row,
            sheet,
            action,
            fieldName,
            `${fieldName} is required`
        );
        return false;
    }
    return true;
};

/**
 * Validate string length
 */
const validateStringLength = (
    value,
    fieldName,
    min,
    max,
    result,
    row,
    sheet,
    action
) => {
    if (!value) return true;

    if (typeof value !== "string") {
        addError(
            result,
            row,
            sheet,
            action,
            fieldName,
            `${fieldName} must be a string`
        );
        return false;
    }

    if (value.length < min || value.length > max) {
        addError(
            result,
            row,
            sheet,
            action,
            fieldName,
            `${fieldName} must be between ${min} and ${max} characters (current: ${value.length})`
        );
        return false;
    }
    return true;
};

/**
 * Validate number range
 */
const validateNumberRange = (
    value,
    fieldName,
    min,
    max,
    result,
    row,
    sheet,
    action
) => {
    if (value === null || value === undefined) return true;

    if (typeof value !== "number" || isNaN(value)) {
        addError(
            result,
            row,
            sheet,
            action,
            fieldName,
            `${fieldName} must be a valid number`
        );
        return false;
    }

    if (value < min || value > max) {
        addError(
            result,
            row,
            sheet,
            action,
            fieldName,
            `${fieldName} must be between ${min} and ${max} (current: ${value})`
        );
        return false;
    }
    return true;
};

/**
 * Validate enum value
 */
const validateEnum = (
    value,
    fieldName,
    allowedValues,
    result,
    row,
    sheet,
    action
) => {
    if (!value) return true;

    if (!allowedValues.includes(value)) {
        addError(
            result,
            row,
            sheet,
            action,
            fieldName,
            `${fieldName} must be one of: ${allowedValues.join(
                ", "
            )} (current: ${value})`
        );
        return false;
    }
    return true;
};

/**
 * Validate Product based on actual Product model
 */
const validateProduct = async (
    parsedProduct,
    result,
    existingCategories,
    existingSubcategories,
    existingProductMap,
    productNamesInFile
) => {
    const row = parsedProduct._rowNumber;
    const action = parsedProduct._action;
    result.currentProductName = parsedProduct.product_name;

    // Validate _action
    if (!validateRequired(action, "_action", result, row, "Products", action)) {
        return;
    }
    validateEnum(
        action,
        "_action",
        ["CREATE", "UPDATE"],
        result,
        row,
        "Products",
        action
    );

    // For UPDATE, only need product_id
    if (action === "UPDATE") {
        if (
            !validateRequired(
                parsedProduct.product_id,
                "product_id",
                result,
                row,
                "Products",
                action
            )
        ) {
            return;
        }
        // Validate MongoDB ObjectId format
        if (!/^[0-9a-fA-F]{24}$/.test(parsedProduct.product_id)) {
            addError(
                result,
                row,
                "Products",
                action,
                "product_id",
                "Invalid product_id format"
            );
        }
        return; // Skip other validations for UPDATE
    }

    // === For CREATE, validate all required fields ===

    // product_id must be empty for CREATE
    if (parsedProduct.product_id) {
        addError(
            result,
            row,
            "Products",
            action,
            "product_id",
            "product_id must be empty for CREATE"
        );
    }

    // Required: product_name
    if (
        !validateRequired(
            parsedProduct.product_name,
            "product_name",
            result,
            row,
            "Products",
            action
        )
    ) {
        return;
    }
    validateStringLength(
        parsedProduct.product_name,
        "product_name",
        3,
        200,
        result,
        row,
        "Products",
        action
    );

    // Check for duplicate product name in database
    const productNameLower = parsedProduct.product_name.toLowerCase();
    const existingProductId = existingProductMap.get(productNameLower);
    if (existingProductId) {
        addError(
            result,
            row,
            "Products",
            action,
            "product_name",
            `Product "${parsedProduct.product_name}" already exists in database (ID: ${existingProductId}). Use UPDATE action with product_id to update it.`
        );
    }

    // Check for duplicate product name within the file
    if (productNamesInFile.has(productNameLower)) {
        const firstRow = productNamesInFile.get(productNameLower);
        addError(
            result,
            row,
            "Products",
            action,
            "product_name",
            `Duplicate product name "${parsedProduct.product_name}" in file (first occurrence at row ${firstRow})`
        );
    } else {
        productNamesInFile.set(productNameLower, row);
    }

    // Required: category
    if (
        !validateRequired(
            parsedProduct.category,
            "category",
            result,
            row,
            "Products",
            action
        )
    ) {
        return;
    }
    const categoryExists = existingCategories.some(
        (cat) => cat.name.toLowerCase() === parsedProduct.category.toLowerCase()
    );
    if (!categoryExists) {
        addError(
            result,
            row,
            "Products",
            action,
            "category",
            `Category "${parsedProduct.category}" does not exist`
        );
    }

    // Optional: subcategory
    if (parsedProduct.subcategory) {
        const subcategoryExists = existingSubcategories.some(
            (sub) =>
                sub.name.toLowerCase() ===
                parsedProduct.subcategory.toLowerCase()
        );
        if (!subcategoryExists) {
            addError(
                result,
                row,
                "Products",
                action,
                "subcategory",
                `Subcategory "${parsedProduct.subcategory}" does not exist`
            );
        }
    }

    // Required: purity (enum: "925" or "999")
    if (
        !validateRequired(
            parsedProduct.purity,
            "purity",
            result,
            row,
            "Products",
            action
        )
    ) {
        return;
    }
    validateEnum(
        parsedProduct.purity,
        "purity",
        ["925", "999"],
        result,
        row,
        "Products",
        action
    );

    // Required: making_charges_per_gram (number >= 0)
    if (
        !validateRequired(
            parsedProduct.making_charges_per_gram,
            "making_charges_per_gram",
            result,
            row,
            "Products",
            action
        )
    ) {
        return;
    }
    validateNumberRange(
        parsedProduct.making_charges_per_gram,
        "making_charges_per_gram",
        0,
        100000,
        result,
        row,
        "Products",
        action
    );

    // Required: gst_rate (default 3)
    if (parsedProduct.gst_rate !== undefined) {
        validateNumberRange(
            parsedProduct.gst_rate,
            "gst_rate",
            0,
            100,
            result,
            row,
            "Products",
            action
        );
    }

    // Optional: description
    validateStringLength(
        parsedProduct.description,
        "description",
        0,
        5000,
        result,
        row,
        "Products",
        action
    );

    // Optional: short_description (max 500)
    validateStringLength(
        parsedProduct.short_description,
        "short_description",
        0,
        500,
        result,
        row,
        "Products",
        action
    );

    // Optional: gender (enum: "men", "women", "unisex", "")
    if (parsedProduct.gender) {
        validateEnum(
            parsedProduct.gender,
            "gender",
            ["men", "women", "unisex", ""],
            result,
            row,
            "Products",
            action
        );
    }
};

/**
 * Validate ProductVariant based on actual ProductVariant model
 */
const validateVariant = async (parsedVariant, result, productNames) => {
    const row = parsedVariant._rowNumber;
    const action = parsedVariant._action;

    // Validate _action
    if (!validateRequired(action, "_action", result, row, "Variants", action)) {
        return;
    }
    validateEnum(
        action,
        "_action",
        ["CREATE", "UPDATE"],
        result,
        row,
        "Variants",
        action
    );

    // For UPDATE, only need SKU (unique identifier)
    if (action === "UPDATE") {
        if (
            !validateRequired(
                parsedVariant.sku,
                "sku",
                result,
                row,
                "Variants",
                action
            )
        ) {
            return;
        }
        return; // Skip other validations for UPDATE
    }

    // === For CREATE, validate all required fields ===

    // Required: product_name (must match a product in Products sheet)
    if (
        !validateRequired(
            parsedVariant.product_name,
            "product_name",
            result,
            row,
            "Variants",
            action
        )
    ) {
        return;
    }
    if (!productNames.has(parsedVariant.product_name)) {
        addError(
            result,
            row,
            "Variants",
            action,
            "product_name",
            `Product "${parsedVariant.product_name}" not found in Products sheet`
        );
    }

    // SKU is auto-generated for CREATE, so no validation needed

    // Required: variant_name
    if (
        !validateRequired(
            parsedVariant.variant_name,
            "variant_name",
            result,
            row,
            "Variants",
            action
        )
    ) {
        return;
    }
    validateStringLength(
        parsedVariant.variant_name,
        "variant_name",
        1,
        200,
        result,
        row,
        "Variants",
        action
    );

    // Required: weight (number > 0)
    if (
        !validateRequired(
            parsedVariant.weight,
            "weight",
            result,
            row,
            "Variants",
            action
        )
    ) {
        return;
    }
    validateNumberRange(
        parsedVariant.weight,
        "weight",
        0.01,
        100000,
        result,
        row,
        "Variants",
        action
    );

    // Required: selling_price (number >= 0)
    if (
        !validateRequired(
            parsedVariant.selling_price,
            "selling_price",
            result,
            row,
            "Variants",
            action
        )
    ) {
        return;
    }
    validateNumberRange(
        parsedVariant.selling_price,
        "selling_price",
        0,
        10000000,
        result,
        row,
        "Variants",
        action
    );

    // Optional: mrp (must be >= selling_price if provided)
    if (parsedVariant.mrp !== null && parsedVariant.mrp !== undefined) {
        validateNumberRange(
            parsedVariant.mrp,
            "mrp",
            0,
            10000000,
            result,
            row,
            "Variants",
            action
        );
        if (parsedVariant.mrp < parsedVariant.selling_price) {
            addError(
                result,
                row,
                "Variants",
                action,
                "mrp",
                "MRP cannot be less than selling price"
            );
        }
    }

    // Optional: cost_price
    if (
        parsedVariant.cost_price !== null &&
        parsedVariant.cost_price !== undefined
    ) {
        validateNumberRange(
            parsedVariant.cost_price,
            "cost_price",
            0,
            10000000,
            result,
            row,
            "Variants",
            action
        );
    }

    // Optional: stock_quantity
    validateNumberRange(
        parsedVariant.stock_quantity,
        "stock_quantity",
        0,
        1000000,
        result,
        row,
        "Variants",
        action
    );

    // Optional: low_stock_threshold
    validateNumberRange(
        parsedVariant.low_stock_threshold,
        "low_stock_threshold",
        0,
        10000,
        result,
        row,
        "Variants",
        action
    );

    // Optional: dimensions
    if (parsedVariant.length) {
        validateNumberRange(
            parsedVariant.length,
            "length",
            0,
            10000,
            result,
            row,
            "Variants",
            action
        );
    }
    if (parsedVariant.width) {
        validateNumberRange(
            parsedVariant.width,
            "width",
            0,
            10000,
            result,
            row,
            "Variants",
            action
        );
    }
    if (parsedVariant.height) {
        validateNumberRange(
            parsedVariant.height,
            "height",
            0,
            10000,
            result,
            row,
            "Variants",
            action
        );
    }

    // Optional: attributes format validation
    if (parsedVariant.attributes) {
        const attrPairs = parsedVariant.attributes.split(";");
        for (const pair of attrPairs) {
            if (pair.trim() && !pair.includes(":")) {
                addError(
                    result,
                    row,
                    "Variants",
                    action,
                    "attributes",
                    `Invalid attributes format. Use "key:value; key:value" (current: "${pair}")`
                );
                break;
            }
        }
    }
};

/**
 * Check for duplicate SKUs in variants
 */
const checkDuplicateSKUs = (parsedVariants, result) => {
    const skuMap = new Map();

    parsedVariants.forEach((variant) => {
        if (variant.sku && variant._action === "CREATE") {
            // For CREATE, SKU is auto-generated, skip duplicate check
            return;
        }

        if (variant.sku && variant._action === "UPDATE") {
            if (skuMap.has(variant.sku)) {
                addError(
                    result,
                    variant._rowNumber,
                    "Variants",
                    variant._action,
                    "sku",
                    `Duplicate SKU "${
                        variant.sku
                    }" found (also in row ${skuMap.get(variant.sku)})`
                );
            } else {
                skuMap.set(variant.sku, variant._rowNumber);
            }
        }
    });
};

/**
 * Main validation function
 */
export const validateImportData = async (parsedProducts, parsedVariants) => {
    const result = {
        valid: true,
        errors: [],
        warnings: [],
        stats: {
            products: {
                total: parsedProducts.length,
                valid: 0,
                invalid: 0,
            },
            variants: {
                total: parsedVariants.length,
                valid: 0,
                invalid: 0,
            },
        },
        currentProductName: "",
    };

    try {
        // Fetch categories and subcategories
        const [categories, subcategories] = await Promise.all([
            Category.find({ isActive: true, parent: null })
                .select("_id name")
                .lean(),
            Category.find({ isActive: true, parent: { $ne: null } })
                .select("_id name")
                .lean(),
        ]);

        // For CREATE operations, check for duplicate product names in database
        const productNamesToCheck = parsedProducts
            .filter((p) => p._action === "CREATE")
            .map((p) => p.product_name)
            .filter(Boolean); // Remove null/undefined

        const existingProducts = await Product.find({
            name: { $in: productNamesToCheck },
            isActive: true,
        })
            .select("_id name")
            .lean();

        // Create map of existing product names (case-insensitive) -> product ID
        const existingProductMap = new Map(
            existingProducts.map((p) => [
                p.name.toLowerCase(),
                p._id.toString(),
            ])
        );

        // Track product names within the file to detect duplicates
        const productNamesInFile = new Map(); // name -> first row number

        // Get product names from parsed data
        const productNames = new Set(parsedProducts.map((p) => p.product_name));

        // Validate each product
        for (const product of parsedProducts) {
            await validateProduct(
                product,
                result,
                categories,
                subcategories,
                existingProductMap,
                productNamesInFile
            );
        }

        // Validate each variant
        for (const variant of parsedVariants) {
            await validateVariant(variant, result, productNames);
        }

        // Check for duplicate SKUs
        checkDuplicateSKUs(parsedVariants, result);

        // Calculate stats
        result.stats.products.invalid = result.errors.filter(
            (e) => e.sheet === "Products"
        ).length;
        result.stats.products.valid =
            result.stats.products.total - result.stats.products.invalid;

        result.stats.variants.invalid = result.errors.filter(
            (e) => e.sheet === "Variants"
        ).length;
        result.stats.variants.valid =
            result.stats.variants.total - result.stats.variants.invalid;

        result.valid = result.errors.length === 0;

        logger.info(
            `Validation completed: ${result.valid ? "PASSED" : "FAILED"}`
        );
        logger.info(
            `Products: ${result.stats.products.valid}/${result.stats.products.total} valid`
        );
        logger.info(
            `Variants: ${result.stats.variants.valid}/${result.stats.variants.total} valid`
        );

        return result;
    } catch (error) {
        logger.error("Validation error:", error);
        throw error;
    }
};

export default {
    validateImportData,
};
