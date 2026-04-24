/**
 * Validation helper functions
 */
const validateRequired = (value) => {
    return value !== undefined && value !== null && value !== "";
};

const validateEnum = (value, allowedValues) => {
    return allowedValues.includes(value);
};

const validateNumber = (value) => {
    return !isNaN(value) && typeof Number(value) === "number";
};

const validateDate = (value) => {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date);
};

const validateBannerCreate = (data) => {
    const errors = {};

    // Title validation
    if (!validateRequired(data.title)) {
        errors.title = "Banner title is required";
    } else if (data.title.length > 100) {
        errors.title = "Title cannot exceed 100 characters";
    }

    // Link URL validation (optional)
    if (data.link?.url && typeof data.link.url !== "string") {
        errors["link.url"] = "Link URL must be a string";
    }

    // Display location validation
    if (
        data.displayLocation &&
        !validateEnum(data.displayLocation, [
            "home",
            "shop",
            "about",
            "contact",
            "all",
        ])
    ) {
        errors.displayLocation =
            "Display location must be one of: home, shop, about, contact, all";
    }

    // Sort order validation
    if (data.sortOrder !== undefined && data.sortOrder !== null) {
        if (!validateNumber(data.sortOrder)) {
            errors.sortOrder = "Sort order must be a valid number";
        }
    }

    // Date validation
    if (data.startDate && !validateDate(data.startDate)) {
        errors.startDate = "Start date must be a valid date";
    }

    if (data.endDate && !validateDate(data.endDate)) {
        errors.endDate = "End date must be a valid date";
    }

    // Date range validation
    if (data.startDate && data.endDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        if (start >= end) {
            errors.dateRange = "End date must be after start date";
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

const validateBannerUpdate = (data) => {
    const errors = {};

    // Title validation (if provided)
    if (data.title !== undefined) {
        if (!validateRequired(data.title)) {
            errors.title = "Banner title cannot be empty";
        } else if (data.title.length > 100) {
            errors.title = "Title cannot exceed 100 characters";
        }
    }

    // Link URL validation (optional)
    if (data.link?.url && typeof data.link.url !== "string") {
        errors["link.url"] = "Link URL must be a string";
    }

    // Display location validation
    if (
        data.displayLocation &&
        !validateEnum(data.displayLocation, [
            "home",
            "shop",
            "about",
            "contact",
            "all",
        ])
    ) {
        errors.displayLocation =
            "Display location must be one of: home, shop, about, contact, all";
    }

    // Sort order validation
    if (data.sortOrder !== undefined && data.sortOrder !== null) {
        if (!validateNumber(data.sortOrder)) {
            errors.sortOrder = "Sort order must be a valid number";
        }
    }

    // Date validation
    if (data.startDate && !validateDate(data.startDate)) {
        errors.startDate = "Start date must be a valid date";
    }

    if (data.endDate && !validateDate(data.endDate)) {
        errors.endDate = "End date must be a valid date";
    }

    // Date range validation
    if (data.startDate && data.endDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        if (start >= end) {
            errors.dateRange = "End date must be after start date";
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

export { validateBannerCreate, validateBannerUpdate };
