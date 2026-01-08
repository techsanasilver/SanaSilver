/**
 * Custom validation helpers
 */
const validateRequired = (value, fieldName) => {
    if (!value || (typeof value === "string" && value.trim() === "")) {
        throw new Error(`${fieldName} is required`);
    }
};

const validateNumber = (value, fieldName, min = null, max = null) => {
    if (value !== undefined && value !== null && value !== "") {
        const num = Number(value);
        if (isNaN(num)) {
            throw new Error(`${fieldName} must be a number`);
        }
        if (min !== null && num < min) {
            throw new Error(`${fieldName} cannot be less than ${min}`);
        }
        if (max !== null && num > max) {
            throw new Error(`${fieldName} cannot be greater than ${max}`);
        }
        return num;
    }
    return value;
};

const validateEnum = (value, fieldName, allowedValues) => {
    if (value && !allowedValues.includes(value)) {
        throw new Error(
            `${fieldName} must be one of: ${allowedValues.join(", ")}`
        );
    }
};

const validateArray = (value, fieldName, minLength = null) => {
    if (value !== undefined && !Array.isArray(value)) {
        throw new Error(`${fieldName} must be an array`);
    }
    if (minLength !== null && value && value.length < minLength) {
        throw new Error(`${fieldName} must have at least ${minLength} item(s)`);
    }
};

/**
 * Validate product creation data
 */
export const validateCreateProduct = (data) => {
    const errors = [];

    try {
        // Required fields
        validateRequired(data.name, "Product name");
        validateRequired(data.category, "Category");
        validateRequired(data.purity, "Purity");
        validateRequired(data.makingChargesPerGram, "Making charges per gram");
        validateRequired(data.variants, "Variants");

        // Enum validations
        validateEnum(data.purity, "Purity", ["925", "999"]);
        if (data.attributes?.gender) {
            validateEnum(data.attributes.gender, "Gender", [
                "men",
                "women",
                "unisex",
                "",
            ]);
        }

        // Number validations
        if (data.makingChargesPerGram !== undefined) {
            validateNumber(
                data.makingChargesPerGram,
                "Making charges per gram",
                0
            );
        }
        if (data.gstRate !== undefined) {
            validateNumber(data.gstRate, "GST rate", 0, 100);
        }

        // Array validations
        validateArray(data.variants, "Variants", 1);

        // Validate each variant
        if (Array.isArray(data.variants)) {
            data.variants.forEach((variant, index) => {
                try {
                    validateRequired(
                        variant.variantName,
                        `Variant ${index + 1} name`
                    );
                    validateRequired(
                        variant.weight,
                        `Variant ${index + 1} weight`
                    );
                    validateRequired(
                        variant.sellingPrice,
                        `Variant ${index + 1} selling price`
                    );

                    validateNumber(
                        variant.weight,
                        `Variant ${index + 1} weight`,
                        0.01
                    );
                    validateNumber(
                        variant.sellingPrice,
                        `Variant ${index + 1} selling price`,
                        0
                    );

                    if (variant.mrp !== undefined) {
                        validateNumber(
                            variant.mrp,
                            `Variant ${index + 1} MRP`,
                            0
                        );
                    }
                    if (variant.costPrice !== undefined) {
                        validateNumber(
                            variant.costPrice,
                            `Variant ${index + 1} cost price`,
                            0
                        );
                    }
                    if (variant.stockQuantity !== undefined) {
                        validateNumber(
                            variant.stockQuantity,
                            `Variant ${index + 1} stock quantity`,
                            0
                        );
                    }
                } catch (err) {
                    errors.push(err.message);
                }
            });
        }
    } catch (err) {
        errors.push(err.message);
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Validate product update data
 */
export const validateUpdateProduct = (data) => {
    const errors = [];

    try {
        // Enum validations
        if (data.purity) {
            validateEnum(data.purity, "Purity", ["925", "999"]);
        }
        if (data.attributes?.gender) {
            validateEnum(data.attributes.gender, "Gender", [
                "men",
                "women",
                "unisex",
                "",
            ]);
        }

        // Number validations
        if (data.makingChargesPerGram !== undefined) {
            validateNumber(
                data.makingChargesPerGram,
                "Making charges per gram",
                0
            );
        }
        if (data.gstRate !== undefined) {
            validateNumber(data.gstRate, "GST rate", 0, 100);
        }

        // Validate variants if provided
        if (data.variants && Array.isArray(data.variants)) {
            data.variants.forEach((variant, index) => {
                try {
                    if (variant.weight !== undefined) {
                        validateNumber(
                            variant.weight,
                            `Variant ${index + 1} weight`,
                            0.01
                        );
                    }
                    if (variant.sellingPrice !== undefined) {
                        validateNumber(
                            variant.sellingPrice,
                            `Variant ${index + 1} selling price`,
                            0
                        );
                    }
                    if (variant.mrp !== undefined) {
                        validateNumber(
                            variant.mrp,
                            `Variant ${index + 1} MRP`,
                            0
                        );
                    }
                    if (variant.costPrice !== undefined) {
                        validateNumber(
                            variant.costPrice,
                            `Variant ${index + 1} cost price`,
                            0
                        );
                    }
                    if (variant.stockQuantity !== undefined) {
                        validateNumber(
                            variant.stockQuantity,
                            `Variant ${index + 1} stock quantity`,
                            0
                        );
                    }
                } catch (err) {
                    errors.push(err.message);
                }
            });
        }
    } catch (err) {
        errors.push(err.message);
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Validate variant creation data
 */
export const validateCreateVariant = (data) => {
    const errors = [];

    try {
        validateRequired(data.variantName, "Variant name");
        validateRequired(data.weight, "Weight");
        validateRequired(data.sellingPrice, "Selling price");

        validateNumber(data.weight, "Weight", 0.01);
        validateNumber(data.sellingPrice, "Selling price", 0);

        if (data.mrp !== undefined) {
            validateNumber(data.mrp, "MRP", 0);
        }
        if (data.costPrice !== undefined) {
            validateNumber(data.costPrice, "Cost price", 0);
        }
        if (data.stockQuantity !== undefined) {
            validateNumber(data.stockQuantity, "Stock quantity", 0);
        }
    } catch (err) {
        errors.push(err.message);
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Validate variant update data
 */
export const validateUpdateVariant = (data) => {
    const errors = [];

    try {
        if (data.weight !== undefined) {
            validateNumber(data.weight, "Weight", 0.01);
        }
        if (data.sellingPrice !== undefined) {
            validateNumber(data.sellingPrice, "Selling price", 0);
        }
        if (data.mrp !== undefined) {
            validateNumber(data.mrp, "MRP", 0);
        }
        if (data.costPrice !== undefined) {
            validateNumber(data.costPrice, "Cost price", 0);
        }
        if (data.stockQuantity !== undefined) {
            validateNumber(data.stockQuantity, "Stock quantity", 0);
        }
    } catch (err) {
        errors.push(err.message);
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Validate stock update data
 */
export const validateUpdateStock = (data) => {
    const errors = [];

    try {
        validateRequired(data.stockQuantity, "Stock quantity");
        validateNumber(data.stockQuantity, "Stock quantity", 0);
    } catch (err) {
        errors.push(err.message);
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};
