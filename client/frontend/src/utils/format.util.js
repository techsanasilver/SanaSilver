/**
 * Format Utility
 * Helper functions for formatting data (currency, dates, numbers, etc.)
 */

/**
 * Format currency in INR
 * @param {number} amount - Amount to format
 * @param {boolean} showDecimals - Show decimal places (default: true)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, showDecimals = true) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return "₹0";
    }

    const formatter = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: showDecimals ? 2 : 0,
        maximumFractionDigits: showDecimals ? 2 : 0,
    });

    return formatter.format(amount);
};

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type: 'short', 'medium', 'long', 'time'
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = "medium") => {
    if (!date) return "";

    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
        return "";
    }

    const options = {
        short: { year: "numeric", month: "short", day: "numeric" },
        medium: {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        },
        long: {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        },
        time: { hour: "2-digit", minute: "2-digit" },
    };

    return new Intl.DateTimeFormat("en-IN", options[format]).format(dateObj);
};

/**
 * Format phone number
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
    if (!phone) return "";

    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, "");

    // Format as +91 XXXXX XXXXX
    if (cleaned.length === 10) {
        return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }

    if (cleaned.length === 12 && cleaned.startsWith("91")) {
        return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    }

    return phone;
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + "...";
};

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) {
        return "0";
    }

    return new Intl.NumberFormat("en-IN").format(num);
};

/**
 * Calculate discount percentage
 * @param {number} originalPrice - Original price
 * @param {number} discountedPrice - Discounted price
 * @returns {number} Discount percentage
 */
export const calculateDiscountPercentage = (originalPrice, discountedPrice) => {
    if (!originalPrice || !discountedPrice || originalPrice <= 0) {
        return 0;
    }

    const discount = ((originalPrice - discountedPrice) / originalPrice) * 100;
    return Math.round(discount);
};

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

/**
 * Get relative time (e.g., "2 hours ago", "3 days ago")
 * @param {string|Date} date - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
    if (!date) return "";

    const dateObj = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffInMs = now - dateObj;
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
        return "Just now";
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    } else {
        return formatDate(dateObj, "short");
    }
};

/**
 * Capitalize first letter
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalizeFirst = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Format order status for display
 * @param {string} status - Order status
 * @returns {string} Formatted status
 */
export const formatOrderStatus = (status) => {
    const statusMap = {
        pending: "Pending",
        confirmed: "Confirmed",
        processing: "Processing",
        shipped: "Shipped",
        delivered: "Delivered",
        cancelled: "Cancelled",
        returned: "Returned",
    };

    return statusMap[status] || capitalizeFirst(status);
};
