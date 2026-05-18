import axiosInstance from "../utils/axios";

/**
 * Get analytics KPI summary
 * @param {string} period - "today" | "week" | "month" | "year" | "all"
 */
export const getAnalyticsSummary = async (period = "month") => {
    const response = await axiosInstance.get("/analytics/summary", {
        params: { period },
    });
    return response.data;
};

/**
 * Get daily revenue trend
 * @param {number} days - Number of days to look back (7-365)
 */
export const getRevenueTrend = async (days = 30) => {
    const response = await axiosInstance.get("/analytics/revenue-trend", {
        params: { days },
    });
    return response.data;
};

/**
 * Get top products by revenue
 * @param {number} limit - Number of products to return (1-20)
 */
export const getTopProducts = async (limit = 8) => {
    const response = await axiosInstance.get("/analytics/top-products", {
        params: { limit },
    });
    return response.data;
};
