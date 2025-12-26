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

const formatMessage = (level, message, ...args) => {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? JSON.stringify(args, null, 2) : "";
    return `[${level}] ${timestamp} - ${message} ${formattedArgs}`.trim();
};

const logger = {
    /**
     * Debug logs - ONLY in development
     * Use for: Testing, debugging, verbose information
     */
    debug: (message, ...args) => {
        if (isDevelopment) {
            console.debug(formatMessage("DEBUG", message, ...args));
        }
    },

    /**
     * Info logs - Both development and production
     * Use for: Important operational events, user actions, system state changes
     */
    info: (message, ...args) => {
        console.log(formatMessage("INFO", message, ...args));
    },

    /**
     * Warning logs - Both development and production
     * Use for: Potentially harmful situations, deprecated features
     */
    warn: (message, ...args) => {
        console.warn(formatMessage("WARN", message, ...args));
    },

    /**
     * Error logs - Both development and production
     * Use for: Error events, exceptions, critical issues
     */
    error: (message, ...args) => {
        console.error(formatMessage("ERROR", message, ...args));
    },

    /**
     * Test logs - ONLY in development (alias for debug)
     * Use for: Test-related logging
     */
    test: (message, ...args) => {
        if (isDevelopment) {
            console.log(formatMessage("TEST", message, ...args));
        }
    },
};

export default logger;
