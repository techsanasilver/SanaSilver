/**
 * Custom Logger Utility
 * Provides consistent logging format across the application
 *
 * Log Levels:
 * - debug: Development only - for debugging and testing
 * - info: Both environments - important operational information
 * - warn: Both environments - warning messages
 * - error: Both environments - error messages
 */

const isDevelopment = process.env.NODE_ENV !== "production";

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

    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} IST`;
};

const formatMessage = (level, message) => {
    const timestamp = getISTTimestamp();
    return `[${level}] ${timestamp} - ${message}`;
};

const logger = {
    /**
     * Debug logs - ONLY in development
     * Use for: Testing, debugging, verbose information
     */
    debug: (message, ...args) => {
        if (isDevelopment) {
            if (args.length > 0) {
                console.groupCollapsed(formatMessage("DEBUG", message));
                args.forEach((arg, index) => {
                    console.log(`Arg ${index + 1}:`, arg);
                });
                console.groupEnd();
            } else {
                console.debug(formatMessage("DEBUG", message));
            }
        }
    },

    /**
     * Info logs - Both development and production
     * Use for: Important operational events, user actions, system state changes
     */
    info: (message, ...args) => {
        if (args.length > 0) {
            console.groupCollapsed(formatMessage("INFO", message));
            args.forEach((arg, index) => {
                console.log(`Data ${index + 1}:`, arg);
            });
            console.groupEnd();
        } else {
            console.log(formatMessage("INFO", message));
        }
    },

    /**
     * Warning logs - Both development and production
     * Use for: Potentially harmful situations, deprecated features
     */
    warn: (message, ...args) => {
        if (args.length > 0) {
            console.groupCollapsed(formatMessage("WARN", message));
            args.forEach((arg, index) => {
                console.warn(`Data ${index + 1}:`, arg);
            });
            console.groupEnd();
        } else {
            console.warn(formatMessage("WARN", message));
        }
    },

    /**
     * Error logs - Both development and production
     * Use for: Error events, exceptions, critical issues
     */
    error: (message, ...args) => {
        if (args.length > 0) {
            console.groupCollapsed(formatMessage("ERROR", message));
            args.forEach((arg, index) => {
                console.error(`Error ${index + 1}:`, arg);
            });
            console.groupEnd();
        } else {
            console.error(formatMessage("ERROR", message));
        }
    },

    /**
     * Test logs - ONLY in development (alias for debug)
     * Use for: Test-related logging
     */
    test: (message, ...args) => {
        if (isDevelopment) {
            if (args.length > 0) {
                console.groupCollapsed(formatMessage("TEST", message));
                args.forEach((arg, index) => {
                    console.log(`Test Data ${index + 1}:`, arg);
                });
                console.groupEnd();
            } else {
                console.log(formatMessage("TEST", message));
            }
        }
    },

    /**
     * API Request logs - ONLY in development
     * Use for: Logging outgoing API requests
     */
    apiRequest: (method, url, params = null, data = null) => {
        if (isDevelopment) {
            console.groupCollapsed(
                formatMessage(
                    "API REQUEST",
                    `${method?.toUpperCase() || "UNKNOWN"} ${url}`,
                ),
            );
            if (params && Object.keys(params).length > 0) {
                console.log("Params:", params);
            }
            if (data) {
                console.log("Body:", data);
            }
            console.groupEnd();
        }
    },

    /**
     * API Response logs - ONLY in development
     * Use for: Logging API responses
     */
    apiResponse: (method, url, status, data = null) => {
        if (isDevelopment) {
            const isError = status >= 400;
            console.groupCollapsed(
                formatMessage(
                    isError ? "API ERROR" : "API RESPONSE",
                    `${method?.toUpperCase() || "UNKNOWN"} ${url} (${status})`,
                ),
            );
            if (data) {
                console.log("Response:", data);
            }
            console.groupEnd();
        }
    },
};

export default logger;
