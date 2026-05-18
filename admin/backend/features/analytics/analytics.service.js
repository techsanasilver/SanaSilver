import mongoose from "mongoose";
import Order from "../orders/order.model.js";
import User from "../users/user.model.js";
import Review from "../reviews/review.model.js";
import logger from "../../shared/utils/logger.util.js";

// ============================================================================
// HELPERS
// ============================================================================

const buildDateFilter = (period) => {
    const now = new Date();
    if (period === "today") {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        return { createdAt: { $gte: start } };
    }
    if (period === "week") {
        const start = new Date(now);
        start.setDate(start.getDate() - 7);
        return { createdAt: { $gte: start } };
    }
    if (period === "month") {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { createdAt: { $gte: start } };
    }
    if (period === "year") {
        const start = new Date(now.getFullYear(), 0, 1);
        return { createdAt: { $gte: start } };
    }
    return {}; // "all"
};

// ============================================================================
// ANALYTICS SUMMARY
// ============================================================================

/**
 * Get KPI summary: revenue, orders, customers, avg order value,
 * order status breakdown, payment method breakdown, review stats.
 */
const getAnalyticsSummary = async (period = "month") => {
    try {
        const dateFilter = buildDateFilter(period);

        const [orderStats, customerStats, newCustomerCount, reviewStats] =
            await Promise.all([
                // Revenue / order KPIs + breakdowns
                Order.aggregate([
                    { $match: dateFilter },
                    {
                        $group: {
                            _id: null,
                            totalOrders: { $sum: 1 },
                            totalRevenue: {
                                $sum: {
                                    $cond: [
                                        {
                                            $ne: ["$orderStatus", "cancelled"],
                                        },
                                        "$pricing.total",
                                        0,
                                    ],
                                },
                            },
                            avgOrderValue: { $avg: "$pricing.total" },
                            // Status counts
                            pending: {
                                $sum: {
                                    $cond: [
                                        { $eq: ["$orderStatus", "pending"] },
                                        1,
                                        0,
                                    ],
                                },
                            },
                            confirmed: {
                                $sum: {
                                    $cond: [
                                        {
                                            $eq: ["$orderStatus", "confirmed"],
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },
                            processing: {
                                $sum: {
                                    $cond: [
                                        {
                                            $eq: ["$orderStatus", "processing"],
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },
                            shipped: {
                                $sum: {
                                    $cond: [
                                        { $eq: ["$orderStatus", "shipped"] },
                                        1,
                                        0,
                                    ],
                                },
                            },
                            delivered: {
                                $sum: {
                                    $cond: [
                                        {
                                            $eq: ["$orderStatus", "delivered"],
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },
                            cancelled: {
                                $sum: {
                                    $cond: [
                                        {
                                            $eq: ["$orderStatus", "cancelled"],
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },
                            // Payment method
                            codOrders: {
                                $sum: {
                                    $cond: [
                                        { $eq: ["$payment.method", "cod"] },
                                        1,
                                        0,
                                    ],
                                },
                            },
                            onlineOrders: {
                                $sum: {
                                    $cond: [
                                        {
                                            $eq: [
                                                "$payment.method",
                                                "razorpay",
                                            ],
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },
                        },
                    },
                ]),

                // Total registered customers (all time)
                User.countDocuments({}),

                // New customers in selected period
                User.countDocuments(dateFilter),

                // Review stats (all time)
                Review.aggregate([
                    {
                        $group: {
                            _id: "$status",
                            count: { $sum: 1 },
                            avgRating: { $avg: "$rating" },
                        },
                    },
                ]),
            ]);

        const o = orderStats[0] || {
            totalOrders: 0,
            totalRevenue: 0,
            avgOrderValue: 0,
            pending: 0,
            confirmed: 0,
            processing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0,
            codOrders: 0,
            onlineOrders: 0,
        };

        // Flatten review stats
        const reviewSummary = {
            approved: 0,
            pending: 0,
            rejected: 0,
            avgRating: 0,
        };
        reviewStats.forEach((r) => {
            if (r._id in reviewSummary) {
                reviewSummary[r._id] = r.count;
                if (r._id === "approved") {
                    reviewSummary.avgRating = Math.round(r.avgRating * 10) / 10;
                }
            }
        });

        return {
            kpis: {
                totalRevenue: Math.round(o.totalRevenue),
                totalOrders: o.totalOrders,
                totalCustomers: customerStats,
                newCustomers: newCustomerCount,
                avgOrderValue: Math.round(o.avgOrderValue || 0),
            },
            orderStatus: {
                pending: o.pending,
                confirmed: o.confirmed,
                processing: o.processing,
                shipped: o.shipped,
                delivered: o.delivered,
                cancelled: o.cancelled,
            },
            paymentMethod: {
                cod: o.codOrders,
                online: o.onlineOrders,
            },
            reviews: reviewSummary,
        };
    } catch (error) {
        logger.error(`Error in getAnalyticsSummary: ${error.message}`);
        throw error;
    }
};

// ============================================================================
// REVENUE TREND
// ============================================================================

/**
 * Get daily revenue grouped by date for the last `days` days.
 * Excludes cancelled orders from revenue.
 */
const getRevenueTrend = async (days = 30) => {
    try {
        const safedays = Math.min(Math.max(parseInt(days) || 30, 7), 365);
        const since = new Date();
        since.setDate(since.getDate() - safedays);
        since.setHours(0, 0, 0, 0);

        const raw = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: since },
                    orderStatus: { $ne: "cancelled" },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt",
                            timezone: "+05:30",
                        },
                    },
                    revenue: { $sum: "$pricing.total" },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Build a full date map (fill gaps with 0)
        const map = {};
        raw.forEach((r) => {
            map[r._id] = { revenue: Math.round(r.revenue), orders: r.orders };
        });

        const result = [];
        for (let i = safedays - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            result.push({
                date: key,
                revenue: map[key]?.revenue || 0,
                orders: map[key]?.orders || 0,
            });
        }

        return result;
    } catch (error) {
        logger.error(`Error in getRevenueTrend: ${error.message}`);
        throw error;
    }
};

// ============================================================================
// TOP PRODUCTS
// ============================================================================

/**
 * Get top products by revenue from order items.
 * Groups by productId, sums up revenue and units sold.
 */
const getTopProducts = async (limit = 8) => {
    try {
        const safeLimit = Math.min(Math.max(parseInt(limit) || 8, 1), 20);

        const data = await Order.aggregate([
            { $match: { orderStatus: { $ne: "cancelled" } } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product",
                    productName: { $first: "$items.productName" },
                    revenue: { $sum: "$items.total" },
                    unitsSold: { $sum: "$items.quantity" },
                    orderCount: { $sum: 1 },
                },
            },
            { $sort: { revenue: -1 } },
            { $limit: safeLimit },
            {
                $project: {
                    _id: 0,
                    productId: "$_id",
                    productName: 1,
                    revenue: { $round: ["$revenue", 0] },
                    unitsSold: 1,
                    orderCount: 1,
                },
            },
        ]);

        return data;
    } catch (error) {
        logger.error(`Error in getTopProducts: ${error.message}`);
        throw error;
    }
};

export { getAnalyticsSummary, getRevenueTrend, getTopProducts };
