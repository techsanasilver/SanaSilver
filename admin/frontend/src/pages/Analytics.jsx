import { useState, useEffect, useCallback } from "react";
import {
    MdTrendingUp,
    MdShoppingCart,
    MdPeople,
    MdAttachMoney,
    MdStar,
    MdRefresh,
} from "react-icons/md";
import {
    getAnalyticsSummary,
    getRevenueTrend,
    getTopProducts,
} from "../api/analytics.api";
import { handleApiError } from "../utils/axios";
import logger from "../utils/logger.util";
import Loader from "../components/common/Loader";

// ── Formatters ───────────────────────────────────────────────────────────────

const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount || 0);

const formatNumber = (n) => new Intl.NumberFormat("en-IN").format(n || 0);

const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

// ── Period options ────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
    { label: "Today", value: "today" },
    { label: "This Week", value: "week" },
    { label: "This Month", value: "month" },
    { label: "This Year", value: "year" },
    { label: "All Time", value: "all" },
];

const TREND_DAYS_OPTIONS = [
    { label: "7 days", value: 7 },
    { label: "14 days", value: 14 },
    { label: "30 days", value: 30 },
    { label: "90 days", value: 90 },
];

// ── Order status config ───────────────────────────────────────────────────────

const STATUS_CONFIG = [
    {
        key: "pending",
        label: "Pending",
        color: "bg-warning",
        text: "text-warning",
    },
    {
        key: "confirmed",
        label: "Confirmed",
        color: "bg-info",
        text: "text-info",
    },
    {
        key: "processing",
        label: "Processing",
        color: "bg-primary",
        text: "text-primary",
    },
    { key: "shipped", label: "Shipped", color: "bg-info", text: "text-info" },
    {
        key: "delivered",
        label: "Delivered",
        color: "bg-success",
        text: "text-success",
    },
    {
        key: "cancelled",
        label: "Cancelled",
        color: "bg-danger",
        text: "text-danger",
    },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const pct = (value, total) =>
    total > 0 ? Math.round((value / total) * 100) : 0;

// ── Sub-components ────────────────────────────────────────────────────────────

const KpiCard = ({ icon: Icon, label, value, sub, iconBg, iconColor }) => (
    <div className="bg-surface rounded-lg shadow-md p-6 flex items-start gap-4">
        <div
            className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center shrink-0`}
        >
            <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div className="min-w-0">
            <p className="text-text-secondary text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold text-text mt-0.5 truncate">
                {value}
            </p>
            {sub && <p className="text-xs text-text-secondary mt-1">{sub}</p>}
        </div>
    </div>
);

const SectionCard = ({ title, children, action }) => (
    <div className="bg-surface rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-text">{title}</h2>
            {action}
        </div>
        {children}
    </div>
);

// ── Revenue Bar Chart (pure CSS) ──────────────────────────────────────────────

const RevenueChart = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="flex items-center justify-center h-52">
                <Loader />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <p className="text-center text-text-secondary text-sm py-10">
                No revenue data available
            </p>
        );
    }

    const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
    // Show at most 30 bars; if more, sample evenly
    const visible =
        data.length > 30
            ? data.filter((_, i) => i % Math.ceil(data.length / 30) === 0)
            : data;

    return (
        <div className="flex flex-col gap-2">
            {/* Bars */}
            <div className="flex gap-0.5 h-48 overflow-hidden">
                {visible.map((d) => {
                    const h = Math.max(
                        pct(d.revenue, maxRevenue),
                        d.revenue > 0 ? 2 : 0,
                    );
                    return (
                        <div
                            key={d.date}
                            className="flex-1 h-full flex flex-col items-center justify-end group relative"
                        >
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                                <div className="bg-text text-surface text-xs rounded px-2 py-1 whitespace-nowrap">
                                    <p>{formatDate(d.date)}</p>
                                    <p className="font-semibold">
                                        {formatCurrency(d.revenue)}
                                    </p>
                                    <p>
                                        {d.orders} order
                                        {d.orders !== 1 ? "s" : ""}
                                    </p>
                                </div>
                                <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-text" />
                            </div>
                            {/* Bar */}
                            <div
                                className="w-full bg-accent/80 hover:bg-accent rounded-t transition-all"
                                style={{ height: `${h}%` }}
                            />
                        </div>
                    );
                })}
            </div>
            {/* X-axis labels: first, middle, last */}
            <div className="flex justify-between text-xs text-text-secondary px-0.5">
                <span>{formatDate(visible[0]?.date)}</span>
                <span>
                    {formatDate(visible[Math.floor(visible.length / 2)]?.date)}
                </span>
                <span>{formatDate(visible[visible.length - 1]?.date)}</span>
            </div>
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const Analytics = () => {
    const [period, setPeriod] = useState("month");
    const [trendDays, setTrendDays] = useState(30);

    const [summaryLoading, setSummaryLoading] = useState(true);
    const [trendLoading, setTrendLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(true);

    const [summary, setSummary] = useState(null);
    const [trendData, setTrendData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);

    const [error, setError] = useState(null);

    // ── Fetch summary (re-fetches when period changes) ────────────────────────
    const fetchSummary = useCallback(async (p) => {
        setSummaryLoading(true);
        try {
            const res = await getAnalyticsSummary(p);
            if (res.success) setSummary(res.data);
        } catch (err) {
            logger.error(
                "Failed to fetch analytics summary:",
                handleApiError(err),
            );
            setError("Failed to load analytics summary.");
        } finally {
            setSummaryLoading(false);
        }
    }, []);

    // ── Fetch trend (re-fetches when trendDays changes) ───────────────────────
    const fetchTrend = useCallback(async (days) => {
        setTrendLoading(true);
        try {
            const res = await getRevenueTrend(days);
            if (res.success) setTrendData(res.data || []);
        } catch (err) {
            logger.error("Failed to fetch revenue trend:", handleApiError(err));
        } finally {
            setTrendLoading(false);
        }
    }, []);

    // ── Fetch top products (once on mount) ────────────────────────────────────
    const fetchTopProducts = useCallback(async () => {
        setProductsLoading(true);
        try {
            const res = await getTopProducts(8);
            if (res.success) setTopProducts(res.data || []);
        } catch (err) {
            logger.error("Failed to fetch top products:", handleApiError(err));
        } finally {
            setProductsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSummary(period);
    }, [period, fetchSummary]);

    useEffect(() => {
        fetchTrend(trendDays);
    }, [trendDays, fetchTrend]);

    useEffect(() => {
        fetchTopProducts();
    }, [fetchTopProducts]);

    // ── Derived values ────────────────────────────────────────────────────────
    const kpis = summary?.kpis || {};
    const orderStatus = summary?.orderStatus || {};
    const paymentMethod = summary?.paymentMethod || {};
    const reviews = summary?.reviews || {};

    const totalOrderStatusCount = Object.values(orderStatus).reduce(
        (a, b) => a + b,
        0,
    );
    const totalPaymentCount =
        (paymentMethod.cod || 0) + (paymentMethod.online || 0);
    const maxProductRevenue = Math.max(...topProducts.map((p) => p.revenue), 1);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Page header + period selector */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text">Analytics</h1>
                    <p className="text-text-secondary mt-1 text-sm">
                        Business performance overview
                    </p>
                </div>

                {/* Period tabs */}
                <div className="flex gap-1 bg-surface rounded-lg shadow-md p-1 flex-wrap">
                    {PERIOD_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setPeriod(opt.value)}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                period === opt.value
                                    ? "bg-primary text-white"
                                    : "text-text-secondary hover:text-text hover:bg-border/30"
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="bg-danger/10 border border-danger/30 text-danger rounded-lg p-4 text-sm flex items-center justify-between">
                    <span>{error}</span>
                    <button
                        onClick={() => {
                            setError(null);
                            fetchSummary(period);
                        }}
                        className="ml-4 p-1 hover:bg-danger/20 rounded"
                    >
                        <MdRefresh className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* ── KPI Cards ─────────────────────────────────────────────────── */}
            {summaryLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="bg-surface rounded-lg shadow-md p-6 h-28 animate-pulse"
                        >
                            <div className="h-4 bg-border rounded w-1/2 mb-3" />
                            <div className="h-7 bg-border rounded w-3/4" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KpiCard
                        icon={MdAttachMoney}
                        label="Revenue"
                        value={formatCurrency(kpis.totalRevenue)}
                        sub={`Avg ${formatCurrency(kpis.avgOrderValue)} / order`}
                        iconBg="bg-accent/10"
                        iconColor="text-accent"
                    />
                    <KpiCard
                        icon={MdShoppingCart}
                        label="Orders"
                        value={formatNumber(kpis.totalOrders)}
                        sub="Excludes cancelled"
                        iconBg="bg-info/10"
                        iconColor="text-info"
                    />
                    <KpiCard
                        icon={MdPeople}
                        label="Customers"
                        value={formatNumber(kpis.totalCustomers)}
                        sub={`+${formatNumber(kpis.newCustomers)} new this period`}
                        iconBg="bg-success/10"
                        iconColor="text-success"
                    />
                    <KpiCard
                        icon={MdStar}
                        label="Reviews"
                        value={formatNumber(
                            (reviews.approved || 0) +
                                (reviews.pending || 0) +
                                (reviews.rejected || 0),
                        )}
                        sub={
                            reviews.avgRating
                                ? `Avg rating ${reviews.avgRating} ★ (approved)`
                                : "No approved reviews yet"
                        }
                        iconBg="bg-warning/10"
                        iconColor="text-warning"
                    />
                </div>
            )}

            {/* ── Revenue Trend + Order Status ─────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue trend (2/3 width) */}
                <div className="lg:col-span-2">
                    <SectionCard
                        title="Revenue Trend"
                        action={
                            <div className="flex gap-1">
                                {TREND_DAYS_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setTrendDays(opt.value)}
                                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                            trendDays === opt.value
                                                ? "bg-primary text-white"
                                                : "text-text-secondary hover:text-text hover:bg-border/30"
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        }
                    >
                        <RevenueChart data={trendData} loading={trendLoading} />
                        {!trendLoading && trendData.length > 0 && (
                            <div className="mt-4 flex gap-6 text-sm border-t border-border pt-4">
                                <div>
                                    <p className="text-text-secondary text-xs">
                                        Total Revenue
                                    </p>
                                    <p className="font-semibold text-text">
                                        {formatCurrency(
                                            trendData.reduce(
                                                (s, d) => s + d.revenue,
                                                0,
                                            ),
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-text-secondary text-xs">
                                        Total Orders
                                    </p>
                                    <p className="font-semibold text-text">
                                        {formatNumber(
                                            trendData.reduce(
                                                (s, d) => s + d.orders,
                                                0,
                                            ),
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-text-secondary text-xs">
                                        Peak Day
                                    </p>
                                    <p className="font-semibold text-text">
                                        {formatDate(
                                            trendData.reduce(
                                                (max, d) =>
                                                    d.revenue > max.revenue
                                                        ? d
                                                        : max,
                                                trendData[0],
                                            ).date,
                                        )}
                                    </p>
                                </div>
                            </div>
                        )}
                    </SectionCard>
                </div>

                {/* Order status (1/3 width) */}
                <SectionCard title="Order Status">
                    {summaryLoading ? (
                        <div className="space-y-4">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="h-6 bg-border rounded animate-pulse"
                                />
                            ))}
                        </div>
                    ) : totalOrderStatusCount === 0 ? (
                        <p className="text-text-secondary text-sm text-center py-6">
                            No orders in this period
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {STATUS_CONFIG.map(
                                ({ key, label, color, text }) => {
                                    const count = orderStatus[key] || 0;
                                    const percent = pct(
                                        count,
                                        totalOrderStatusCount,
                                    );
                                    return (
                                        <div key={key}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span
                                                    className={`text-xs font-medium ${text}`}
                                                >
                                                    {label}
                                                </span>
                                                <span className="text-xs text-text-secondary">
                                                    {count} ({percent}%)
                                                </span>
                                            </div>
                                            <div className="h-2 bg-border rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${color} rounded-full transition-all duration-500`}
                                                    style={{
                                                        width: `${percent}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                },
                            )}
                            <p className="text-xs text-text-secondary pt-1 border-t border-border">
                                Total: {formatNumber(totalOrderStatusCount)}{" "}
                                orders
                            </p>
                        </div>
                    )}
                </SectionCard>
            </div>

            {/* ── Top Products + Payment & Reviews ─────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Products (2/3 width) */}
                <div className="lg:col-span-2">
                    <SectionCard title="Top Products by Revenue">
                        {productsLoading ? (
                            <div className="space-y-3">
                                {[...Array(6)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-10 bg-border rounded animate-pulse"
                                    />
                                ))}
                            </div>
                        ) : topProducts.length === 0 ? (
                            <p className="text-text-secondary text-sm text-center py-8">
                                No product sales data yet
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left border-b border-border">
                                            <th className="pb-3 pr-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                                #
                                            </th>
                                            <th className="pb-3 pr-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                                Product
                                            </th>
                                            <th className="pb-3 pr-4 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">
                                                Units Sold
                                            </th>
                                            <th className="pb-3 pr-4 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">
                                                Revenue
                                            </th>
                                            <th className="pb-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                                Share
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {topProducts.map((p, i) => {
                                            const share = pct(
                                                p.revenue,
                                                maxProductRevenue,
                                            );
                                            return (
                                                <tr
                                                    key={p.productId || i}
                                                    className="hover:bg-background"
                                                >
                                                    <td className="py-3 pr-4 text-text-secondary font-medium">
                                                        {i + 1}
                                                    </td>
                                                    <td className="py-3 pr-4">
                                                        <p className="font-medium text-text truncate max-w-45">
                                                            {p.productName ||
                                                                "—"}
                                                        </p>
                                                        <p className="text-xs text-text-secondary">
                                                            {p.orderCount} order
                                                            {p.orderCount !== 1
                                                                ? "s"
                                                                : ""}
                                                        </p>
                                                    </td>
                                                    <td className="py-3 pr-4 text-right font-medium text-text">
                                                        {formatNumber(
                                                            p.unitsSold,
                                                        )}
                                                    </td>
                                                    <td className="py-3 pr-4 text-right font-semibold text-accent">
                                                        {formatCurrency(
                                                            p.revenue,
                                                        )}
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-accent rounded-full"
                                                                    style={{
                                                                        width: `${share}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-text-secondary w-8 text-right">
                                                                {share}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </SectionCard>
                </div>

                {/* Payment method + Reviews (1/3 width) */}
                <div className="space-y-6">
                    {/* Payment method */}
                    <SectionCard title="Payment Methods">
                        {summaryLoading ? (
                            <div className="space-y-4">
                                <div className="h-8 bg-border rounded animate-pulse" />
                                <div className="h-8 bg-border rounded animate-pulse" />
                            </div>
                        ) : totalPaymentCount === 0 ? (
                            <p className="text-text-secondary text-sm text-center py-4">
                                No payment data
                            </p>
                        ) : (
                            <div className="space-y-5">
                                {[
                                    {
                                        key: "online",
                                        label: "Online (Razorpay)",
                                        color: "bg-info",
                                        text: "text-info",
                                    },
                                    {
                                        key: "cod",
                                        label: "Cash on Delivery",
                                        color: "bg-warning",
                                        text: "text-warning",
                                    },
                                ].map(({ key, label, color, text }) => {
                                    const count = paymentMethod[key] || 0;
                                    const percent = pct(
                                        count,
                                        totalPaymentCount,
                                    );
                                    return (
                                        <div key={key}>
                                            <div className="flex justify-between mb-1">
                                                <span
                                                    className={`text-sm font-medium ${text}`}
                                                >
                                                    {label}
                                                </span>
                                                <span className="text-sm text-text-secondary">
                                                    {count} ({percent}%)
                                                </span>
                                            </div>
                                            <div className="h-2.5 bg-border rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${color} rounded-full transition-all duration-500`}
                                                    style={{
                                                        width: `${percent}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                <p className="text-xs text-text-secondary border-t border-border pt-2">
                                    {formatNumber(totalPaymentCount)} total
                                    orders
                                </p>
                            </div>
                        )}
                    </SectionCard>

                    {/* Review stats */}
                    <SectionCard title="Reviews">
                        {summaryLoading ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-8 bg-border rounded animate-pulse"
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {[
                                    {
                                        label: "Approved",
                                        count: reviews.approved || 0,
                                        bg: "bg-success/10",
                                        text: "text-success",
                                    },
                                    {
                                        label: "Pending",
                                        count: reviews.pending || 0,
                                        bg: "bg-warning/10",
                                        text: "text-warning",
                                    },
                                    {
                                        label: "Rejected",
                                        count: reviews.rejected || 0,
                                        bg: "bg-danger/10",
                                        text: "text-danger",
                                    },
                                ].map(({ label, count, bg, text }) => (
                                    <div
                                        key={label}
                                        className={`flex items-center justify-between px-3 py-2 ${bg} rounded-lg`}
                                    >
                                        <span
                                            className={`text-sm font-medium ${text}`}
                                        >
                                            {label}
                                        </span>
                                        <span
                                            className={`text-sm font-bold ${text}`}
                                        >
                                            {formatNumber(count)}
                                        </span>
                                    </div>
                                ))}
                                {reviews.avgRating > 0 && (
                                    <div className="flex items-center justify-between px-3 py-2 bg-accent/10 rounded-lg mt-1">
                                        <span className="text-sm font-medium text-accent">
                                            Avg Rating
                                        </span>
                                        <span className="text-sm font-bold text-accent flex items-center gap-1">
                                            {reviews.avgRating}
                                            <MdStar className="w-4 h-4" />
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </SectionCard>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
