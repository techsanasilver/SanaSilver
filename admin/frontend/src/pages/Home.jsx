import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getOrderStats, getAllOrders } from "../api/orders.api";
import { getAllProducts } from "../api/products.api";
import { listReviews } from "../api/reviews.api";
import { handleApiError } from "../utils/axios";
import logger from "../utils/logger.util";
import Loader from "../components/common/Loader";

const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount || 0);

const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

const getStatusColor = (status) => {
    const colors = {
        pending: "bg-warning/10 text-warning",
        confirmed: "bg-info/10 text-info",
        processing: "bg-primary/10 text-primary",
        shipped: "bg-info/10 text-info",
        delivered: "bg-success/10 text-success",
        cancelled: "bg-danger/10 text-danger",
    };
    return colors[status] || "bg-border/30 text-text-secondary";
};

const Home = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [orderStats, setOrderStats] = useState(null);
    const [totalProducts, setTotalProducts] = useState(0);
    const [recentOrders, setRecentOrders] = useState([]);
    const [pendingReviews, setPendingReviews] = useState([]);
    const [pendingReviewsTotal, setPendingReviewsTotal] = useState(0);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const [statsRes, productsRes, ordersRes, reviewsRes] =
                    await Promise.allSettled([
                        getOrderStats("all"),
                        getAllProducts({ limit: 1, page: 1 }),
                        getAllOrders({ limit: 5, page: 1 }),
                        listReviews({ status: "pending", limit: 5, page: 1 }),
                    ]);

                if (statsRes.status === "fulfilled" && statsRes.value.success) {
                    setOrderStats(statsRes.value.data);
                } else if (statsRes.status === "rejected") {
                    logger.error(
                        "Failed to fetch order stats:",
                        handleApiError(statsRes.reason),
                    );
                }

                if (
                    productsRes.status === "fulfilled" &&
                    productsRes.value.success
                ) {
                    setTotalProducts(
                        productsRes.value.meta?.pagination?.total ?? 0,
                    );
                } else if (productsRes.status === "rejected") {
                    logger.error(
                        "Failed to fetch products count:",
                        handleApiError(productsRes.reason),
                    );
                }

                if (
                    ordersRes.status === "fulfilled" &&
                    ordersRes.value.success
                ) {
                    setRecentOrders(ordersRes.value.data || []);
                } else if (ordersRes.status === "rejected") {
                    logger.error(
                        "Failed to fetch recent orders:",
                        handleApiError(ordersRes.reason),
                    );
                }

                if (
                    reviewsRes.status === "fulfilled" &&
                    reviewsRes.value.success
                ) {
                    setPendingReviews(reviewsRes.value.data || []);
                    setPendingReviewsTotal(
                        reviewsRes.value.meta?.pagination?.total ?? 0,
                    );
                } else if (reviewsRes.status === "rejected") {
                    logger.error(
                        "Failed to fetch pending reviews:",
                        handleApiError(reviewsRes.reason),
                    );
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const today = new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader />
            </div>
        );
    }

    const statusBreakdown = orderStats?.statusBreakdown || {};

    const statusItems = [
        {
            label: "Pending",
            count: statusBreakdown.pending ?? 0,
            color: "text-warning",
            bg: "bg-warning/10",
        },
        {
            label: "Confirmed",
            count: statusBreakdown.confirmed ?? 0,
            color: "text-info",
            bg: "bg-info/10",
        },
        {
            label: "Processing",
            count: statusBreakdown.processing ?? 0,
            color: "text-primary",
            bg: "bg-primary/10",
        },
        {
            label: "Shipped",
            count: statusBreakdown.shipped ?? 0,
            color: "text-info",
            bg: "bg-info/10",
        },
        {
            label: "Delivered",
            count: statusBreakdown.delivered ?? 0,
            color: "text-success",
            bg: "bg-success/10",
        },
        {
            label: "Cancelled",
            count: statusBreakdown.cancelled ?? 0,
            color: "text-danger",
            bg: "bg-danger/10",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-text">
                    Welcome back, {user?.name || "Admin"}!
                </h1>
                <p className="text-text-secondary mt-1">{today}</p>
            </div>

            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Revenue */}
                <div className="bg-surface rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-text-secondary text-sm font-medium">
                                Total Revenue
                            </p>
                            <p className="text-2xl font-bold text-text mt-1">
                                {formatCurrency(orderStats?.totalRevenue)}
                            </p>
                            <p className="text-xs text-text-secondary mt-1">
                                Avg {formatCurrency(orderStats?.avgOrderValue)}/
                                order
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                            <svg
                                className="w-6 h-6 text-accent"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Total Orders */}
                <div className="bg-surface rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-text-secondary text-sm font-medium">
                                Total Orders
                            </p>
                            <p className="text-2xl font-bold text-text mt-1">
                                {orderStats?.totalOrders ?? 0}
                            </p>
                            <p className="text-xs text-text-secondary mt-1">
                                All time
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                            <svg
                                className="w-6 h-6 text-primary"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Total Products */}
                <div className="bg-surface rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-text-secondary text-sm font-medium">
                                Total Products
                            </p>
                            <p className="text-2xl font-bold text-text mt-1">
                                {totalProducts}
                            </p>
                            <p className="text-xs text-text-secondary mt-1">
                                In catalog
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center shrink-0">
                            <svg
                                className="w-6 h-6 text-success"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Pending Reviews */}
                <div className="bg-surface rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-text-secondary text-sm font-medium">
                                Pending Reviews
                            </p>
                            <p className="text-2xl font-bold text-text mt-1">
                                {pendingReviewsTotal}
                            </p>
                            <p className="text-xs text-text-secondary mt-1">
                                Awaiting moderation
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center shrink-0">
                            <svg
                                className="w-6 h-6 text-warning"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Status Breakdown */}
            <div className="bg-surface rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-text">
                        Order Status Breakdown
                    </h2>
                    <button
                        onClick={() => navigate("/orders")}
                        className="text-sm text-accent hover:underline"
                    >
                        View all orders →
                    </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {statusItems.map((item) => (
                        <div
                            key={item.label}
                            className={`${item.bg} rounded-lg p-4 text-center`}
                        >
                            <p className={`text-2xl font-bold ${item.color}`}>
                                {item.count}
                            </p>
                            <p className="text-xs text-text-secondary mt-1">
                                {item.label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Orders + Pending Reviews */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Recent Orders */}
                <div className="lg:col-span-3 bg-surface rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-text">
                            Recent Orders
                        </h2>
                        <button
                            onClick={() => navigate("/orders")}
                            className="text-sm text-accent hover:underline"
                        >
                            View all →
                        </button>
                    </div>

                    {recentOrders.length === 0 ? (
                        <p className="text-text-secondary text-sm text-center py-8">
                            No orders yet
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {recentOrders.map((order) => (
                                <div
                                    key={order._id}
                                    onClick={() =>
                                        navigate(`/orders/${order._id}`)
                                    }
                                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-background cursor-pointer transition-colors"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-text truncate">
                                            {order.orderNumber}
                                        </p>
                                        <p className="text-xs text-text-secondary mt-0.5">
                                            {[
                                                order.customer.firstName,
                                                order.customer.lastName,
                                            ]
                                                .filter(Boolean)
                                                .join(" ") || "—"}{" "}
                                            · {formatDate(order.createdAt)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0 ml-3">
                                        <span
                                            className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}
                                        >
                                            {order.orderStatus}
                                        </span>
                                        <span className="text-sm font-semibold text-text">
                                            {formatCurrency(
                                                order.pricing?.total,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pending Reviews */}
                <div className="lg:col-span-2 bg-surface rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-text">
                            Pending Reviews
                        </h2>
                        <button
                            onClick={() => navigate("/reviews")}
                            className="text-sm text-accent hover:underline"
                        >
                            View all →
                        </button>
                    </div>

                    {pendingReviews.length === 0 ? (
                        <p className="text-text-secondary text-sm text-center py-8">
                            No pending reviews
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {pendingReviews.map((review) => (
                                <div
                                    key={review._id}
                                    onClick={() => navigate("/reviews")}
                                    className="p-3 rounded-lg border border-border hover:bg-background cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-text truncate">
                                            {review.product?.name || "—"}
                                        </p>
                                        <div className="flex gap-0.5 shrink-0 ml-2">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <svg
                                                    key={s}
                                                    className={`w-3 h-3 ${s <= review.rating ? "text-accent" : "text-border"}`}
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-xs text-text-secondary mt-1 line-clamp-1">
                                        {review.comment || "No comment"}
                                    </p>
                                    <p className="text-xs text-text-secondary mt-1">
                                        by{" "}
                                        {review.customerName ||
                                            review.customer?.firstName ||
                                            "Anonymous"}{" "}
                                        · {formatDate(review.createdAt)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-surface rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-text mb-4">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                        onClick={() => navigate("/products/add")}
                        className="p-4 border-2 border-border rounded-lg hover:border-accent hover:bg-accent/5 transition-all text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                                <svg
                                    className="w-5 h-5 text-primary"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-text">
                                    Add Product
                                </p>
                                <p className="text-sm text-text-secondary">
                                    Create new product
                                </p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate("/orders")}
                        className="p-4 border-2 border-border rounded-lg hover:border-accent hover:bg-accent/5 transition-all text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                                <svg
                                    className="w-5 h-5 text-accent"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-text">
                                    View Orders
                                </p>
                                <p className="text-sm text-text-secondary">
                                    Manage all orders
                                </p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate("/bulk")}
                        className="p-4 border-2 border-border rounded-lg hover:border-accent hover:bg-accent/5 transition-all text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center shrink-0">
                                <svg
                                    className="w-5 h-5 text-success"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-text">
                                    Bulk Operations
                                </p>
                                <p className="text-sm text-text-secondary">
                                    Import / export
                                </p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate("/reviews")}
                        className="p-4 border-2 border-border rounded-lg hover:border-accent hover:bg-accent/5 transition-all text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center shrink-0">
                                <svg
                                    className="w-5 h-5 text-warning"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-text">
                                    Manage Reviews
                                </p>
                                <p className="text-sm text-text-secondary">
                                    Approve or reject
                                </p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Home;
