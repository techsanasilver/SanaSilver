import mongoose from "mongoose";

/**
 * Check if a value is a valid MongoDB ObjectId (string or ObjectId instance)
 */
export const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Convert string to ObjectId if valid, throw error if invalid
 */
export const toObjectId = (id, fieldName = "ID") => {
    if (!id) {
        throw new Error(`${fieldName} is required`);
    }

    // If already an ObjectId instance, return it
    if (id instanceof mongoose.Types.ObjectId) {
        return id;
    }

    // If it's a string, validate and convert
    if (typeof id === "string") {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error(`Invalid ${fieldName} format`);
        }
        return new mongoose.Types.ObjectId(id);
    }

    throw new Error(`${fieldName} must be a string or ObjectId`);
};

/**
 * Convert array of string IDs to ObjectId array
 */
export const toObjectIdArray = (ids, fieldName = "IDs") => {
    if (!Array.isArray(ids)) {
        throw new Error(`${fieldName} must be an array`);
    }

    return ids.map((id, index) => toObjectId(id, `${fieldName}[${index}]`));
};

/**
 * Safe ObjectId conversion - returns null instead of throwing error
 */
export const safeToObjectId = (id) => {
    try {
        return toObjectId(id);
    } catch (error) {
        return null;
    }
};

/**
 * Validate ObjectId format without converting
 */
export const validateObjectId = (id, fieldName = "ID") => {
    if (!id) {
        return { valid: false, message: `${fieldName} is required` };
    }

    if (id instanceof mongoose.Types.ObjectId) {
        return { valid: true };
    }

    if (typeof id === "string") {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return { valid: false, message: `Invalid ${fieldName} format` };
        }
        return { valid: true };
    }

    return {
        valid: false,
        message: `${fieldName} must be a string or ObjectId`,
    };
};

/**
 * Check if two ObjectIds are equal (handles string comparison)
 */
export const objectIdEquals = (id1, id2) => {
    if (!id1 || !id2) return false;

    const oid1 =
        id1 instanceof mongoose.Types.ObjectId
            ? id1
            : new mongoose.Types.ObjectId(id1);
    const oid2 =
        id2 instanceof mongoose.Types.ObjectId
            ? id2
            : new mongoose.Types.ObjectId(id2);

    return oid1.equals(oid2);
};
