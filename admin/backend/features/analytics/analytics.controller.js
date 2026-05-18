import * as analyticsService from "./analytics.service.js";
import apiResponse from "../../shared/utils/response.util.js";
import logger from "../../shared/utils/logger.util.js";

/**
 * GET /api/analytics/summary?period=month
 * Returns KPIs, order status breakdown, payment split, review stats.
 */
const getSummary = async (req, res, next) => {
    try {
        const { period = "month" } = req.query;
        const data = await analyticsService.getAnalyticsSummary(period);
        return apiResponse.success(res, "Analytics summary retrieved", data);
    } catch (error) {
        logger.error(`getSummary error: ${error.message}`);
        next(error);
    }
};

/**
 * GET /api/analytics/revenue-trend?days=30
 * Returns daily revenue + order count for the last N days.
 */
const getRevenueTrend = async (req, res, next) => {
    try {
        const { days = 30 } = req.query;
        const data = await analyticsService.getRevenueTrend(days);
        return apiResponse.success(res, "Revenue trend retrieved", data);
    } catch (error) {
        logger.error(`getRevenueTrend error: ${error.message}`);
        next(error);
    }
};

/**
 * GET /api/analytics/top-products?limit=8
 * Returns top products by revenue.
 */
const getTopProducts = async (req, res, next) => {
    try {
        const { limit = 8 } = req.query;
        const data = await analyticsService.getTopProducts(limit);
        return apiResponse.success(res, "Top products retrieved", data);
    } catch (error) {
        logger.error(`getTopProducts error: ${error.message}`);
        next(error);
    }
};

export { getSummary, getRevenueTrend, getTopProducts };
