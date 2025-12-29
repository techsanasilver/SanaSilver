/**
 * Standardized API Response Utility
 * Provides consistent response structure across all endpoints
 */

/**
 * Format date in IST (Indian Standard Time)
 * IST is UTC+5:30
 */
const getISTTimestamp = () => {
    const date = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
    const istDate = new Date(date.getTime() + istOffset);

    // Format: YYYY-MM-DD HH:mm:ss IST
    const year = istDate.getUTCFullYear();
    const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(istDate.getUTCDate()).padStart(2, "0");
    const hours = String(istDate.getUTCHours()).padStart(2, "0");
    const minutes = String(istDate.getUTCMinutes()).padStart(2, "0");
    const seconds = String(istDate.getUTCSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} IST`;
};

const sendResponse = (
    res,
    statusCode,
    success,
    message,
    data = null,
    meta = null
) => {
    const response = {
        success,
        statusCode,
        message,
        data,
        meta,
        timestamp: getISTTimestamp(),
    };

    // Remove null values
    Object.keys(response).forEach((key) => {
        if (response[key] === null) {
            delete response[key];
        }
    });

    return res.status(statusCode).json(response);
};

const apiResponse = {
    // Success responses
    success: (res, message = "Success", data = null, meta = null) => {
        return sendResponse(res, 200, true, message, data, meta);
    },

    created: (
        res,
        message = "Created successfully",
        data = null,
        meta = null
    ) => {
        return sendResponse(res, 201, true, message, data, meta);
    },

    // Success with pagination
    successWithPagination: (res, message, data, pagination) => {
        const meta = { pagination };
        return sendResponse(res, 200, true, message, data, meta);
    },

    // Success with summary
    successWithSummary: (res, message, data, summary) => {
        const meta = { summary };
        return sendResponse(res, 200, true, message, data, meta);
    },

    // Success with both pagination and summary
    successWithMeta: (
        res,
        message,
        data,
        { pagination = null, summary = null } = {}
    ) => {
        const meta = {};
        if (pagination) meta.pagination = pagination;
        if (summary) meta.summary = summary;
        return sendResponse(
            res,
            200,
            true,
            message,
            data,
            Object.keys(meta).length > 0 ? meta : null
        );
    },

    // Error responses
    badRequest: (res, message = "Bad request") => {
        return sendResponse(res, 400, false, message);
    },

    unauthorized: (res, message = "Unauthorized") => {
        return sendResponse(res, 401, false, message);
    },

    forbidden: (res, message = "Forbidden") => {
        return sendResponse(res, 403, false, message);
    },

    notFound: (res, message = "Not found") => {
        return sendResponse(res, 404, false, message);
    },

    conflict: (res, message = "Conflict") => {
        return sendResponse(res, 409, false, message);
    },

    validationError: (res, message = "Validation failed", errors = null) => {
        return sendResponse(res, 422, false, message, errors);
    },

    serverError: (res, message = "Internal server error") => {
        return sendResponse(res, 500, false, message);
    },
};

export default apiResponse;
