/**
 * Global Error Handling Middleware
 * Centralized error handling with consistent error responses
 * Captures file, function, and line number information from stack trace
 */

import logger from "../utils/logger.util.js";
import apiResponse from "../utils/response.util.js";

/**
 * Parse error stack to extract file, function, and line number
 */
const parseErrorStack = (stack) => {
    if (!stack) return null;

    // Get the first meaningful line from stack (skip the error message line)
    const stackLines = stack.split("\n");

    // Find the first line that contains file path
    for (let i = 1; i < stackLines.length; i++) {
        const line = stackLines[i].trim();

        // Match patterns like: at functionName (file:line:column) or at file:line:column
        const match = line.match(/at\s+(?:(\S+)\s+\()?([^)]+):(\d+):(\d+)\)?/);

        if (match) {
            const [, functionName, filePath, lineNumber, columnNumber] = match;

            // Extract just the filename from the full path
            const fileName = filePath.split(/[/\\]/).pop();

            return {
                file: fileName || "unknown",
                function: functionName || "anonymous",
                line: parseInt(lineNumber) || 0,
                column: parseInt(columnNumber) || 0,
                fullPath: filePath,
            };
        }
    }

    return null;
};

const errorHandler = (err, req, res, next) => {
    // Parse stack trace for error location
    const errorLocation = parseErrorStack(err.stack);

    // Log error with location details
    logger.error(`Error on ${req.method} ${req.originalUrl}:`, err.message);

    if (errorLocation) {
        logger.error(
            `Location: ${errorLocation.file}:${errorLocation.line}:${errorLocation.column} in ${errorLocation.function}()`
        );
    }

    logger.error("Stack trace:", err.stack);

    // Handle specific error types
    if (err.name === "ValidationError") {
        return apiResponse.validationError(
            res,
            "Validation failed",
            err.message
        );
    }

    if (err.name === "CastError") {
        return apiResponse.badRequest(res, "Invalid ID format");
    }

    if (err.code === 11000) {
        return apiResponse.conflict(res, "Duplicate entry found");
    }

    if (err.name === "JsonWebTokenError") {
        return apiResponse.unauthorized(res, "Invalid token");
    }

    if (err.name === "TokenExpiredError") {
        return apiResponse.unauthorized(res, "Token expired");
    }

    // Default server error
    return apiResponse.serverError(res, "An unexpected error occurred");
};

export default errorHandler;
