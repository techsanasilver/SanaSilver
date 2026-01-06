/**
 * Validation utility functions for sanitizing and validating inputs
 */

/**
 * Sanitize query parameters - remove empty strings and undefined values
 * @param {Object} params - Query parameters object
 * @returns {Object} - Sanitized parameters
 */
export const sanitizeQueryParams = (params) => {
    const sanitized = {};

    for (const [key, value] of Object.entries(params)) {
        // Skip undefined, null, or empty string values
        if (value !== undefined && value !== null && value !== "") {
            sanitized[key] = value;
        }
    }

    return sanitized;
};

/**
 * Parse boolean query parameter
 * @param {string|boolean} value - Value to parse
 * @param {boolean} defaultValue - Default value if parsing fails
 * @returns {boolean} - Parsed boolean value
 */
export const parseBoolean = (value, defaultValue = undefined) => {
    if (value === undefined || value === null || value === "") {
        return defaultValue;
    }

    if (typeof value === "boolean") {
        return value;
    }

    const lowercaseValue = String(value).toLowerCase().trim();

    if (lowercaseValue === "true" || lowercaseValue === "1") {
        return true;
    }

    if (lowercaseValue === "false" || lowercaseValue === "0") {
        return false;
    }

    return defaultValue;
};

/**
 * Parse integer query parameter
 * @param {string|number} value - Value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @param {Object} options - Validation options {min, max}
 * @returns {number} - Parsed integer value
 */
export const parseInt = (value, defaultValue = undefined, options = {}) => {
    if (value === undefined || value === null || value === "") {
        return defaultValue;
    }

    const parsed = Number.parseInt(value, 10);

    if (Number.isNaN(parsed)) {
        return defaultValue;
    }

    // Apply min/max constraints
    if (options.min !== undefined && parsed < options.min) {
        return options.min;
    }

    if (options.max !== undefined && parsed > options.max) {
        return options.max;
    }

    return parsed;
};

/**
 * Parse float query parameter
 * @param {string|number} value - Value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @param {Object} options - Validation options {min, max}
 * @returns {number} - Parsed float value
 */
export const parseFloat = (value, defaultValue = undefined, options = {}) => {
    if (value === undefined || value === null || value === "") {
        return defaultValue;
    }

    const parsed = Number.parseFloat(value);

    if (Number.isNaN(parsed)) {
        return defaultValue;
    }

    // Apply min/max constraints
    if (options.min !== undefined && parsed < options.min) {
        return options.min;
    }

    if (options.max !== undefined && parsed > options.max) {
        return options.max;
    }

    return parsed;
};

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} - True if valid ObjectId
 */
export const isValidObjectId = (id) => {
    if (!id) return false;

    // Check if it's a valid 24-character hex string
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    return objectIdPattern.test(id);
};

/**
 * Sanitize pagination parameters
 * @param {Object} query - Query object containing page, limit, sortBy, sortOrder
 * @param {Object} defaults - Default values
 * @returns {Object} - Sanitized pagination object
 */
export const sanitizePagination = (query, defaults = {}) => {
    const {
        defaultPage = 1,
        defaultLimit = 20,
        maxLimit = 100,
        defaultSortBy = "createdAt",
        defaultSortOrder = "desc",
        allowedSortFields = [],
    } = defaults;

    const page = parseInt(query.page, defaultPage, { min: 1 });
    const limit = parseInt(query.limit, defaultLimit, {
        min: 1,
        max: maxLimit,
    });

    let sortBy = query.sortBy || defaultSortBy;
    let sortOrder = query.sortOrder || defaultSortOrder;

    // Validate sortBy field if allowedSortFields is provided
    if (allowedSortFields.length > 0 && !allowedSortFields.includes(sortBy)) {
        sortBy = defaultSortBy;
    }

    // Validate sortOrder
    if (!["asc", "desc", "1", "-1"].includes(sortOrder)) {
        sortOrder = defaultSortOrder;
    }

    // Normalize sortOrder
    if (sortOrder === "1") sortOrder = "asc";
    if (sortOrder === "-1") sortOrder = "desc";

    return {
        page,
        limit,
        sortBy,
        sortOrder,
    };
};

/**
 * Trim all string fields in an object
 * @param {Object} obj - Object to trim
 * @returns {Object} - Trimmed object
 */
export const trimStringFields = (obj) => {
    if (!obj || typeof obj !== "object") {
        return obj;
    }

    const trimmed = {};

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string") {
            trimmed[key] = value.trim();
        } else if (Array.isArray(value)) {
            trimmed[key] = value.map((item) =>
                typeof item === "string" ? item.trim() : item
            );
        } else {
            trimmed[key] = value;
        }
    }

    return trimmed;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email
 */
export const isValidEmail = (email) => {
    if (!email) return false;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
};

/**
 * Validate string length
 * @param {string} str - String to validate
 * @param {Object} options - Validation options {min, max}
 * @returns {boolean} - True if valid length
 */
export const isValidLength = (str, options = {}) => {
    if (!str) return false;

    const length = str.length;

    if (options.min !== undefined && length < options.min) {
        return false;
    }

    if (options.max !== undefined && length > options.max) {
        return false;
    }

    return true;
};

/**
 * Clean and validate array input
 * @param {any} value - Value to parse as array
 * @returns {Array} - Cleaned array or empty array
 */
export const parseArray = (value) => {
    if (!value) return [];

    if (Array.isArray(value)) {
        return value.filter(
            (item) => item !== null && item !== undefined && item !== ""
        );
    }

    // Handle comma-separated string
    if (typeof value === "string") {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item !== "");
    }

    return [value];
};

export default {
    sanitizeQueryParams,
    parseBoolean,
    parseInt,
    parseFloat,
    isValidObjectId,
    sanitizePagination,
    trimStringFields,
    isValidEmail,
    isValidLength,
    parseArray,
};
