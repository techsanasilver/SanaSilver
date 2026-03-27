import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { FiShoppingBag } from "react-icons/fi";
import { getOrders } from "../api/orders.api";
import logger from "../utils/logger.util";

const formatPrice = (amount) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount ?? 0);

const OrderSkeleton = () => (
    <div className="animate-pulse bg-white border border-neutral-200 rounded-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-36" />
                <div className="h-3 bg-neutral-200 rounded w-28" />
                <div className="h-3 bg-neutral-200 rounded w-48" />
            </div>
            <div className="space-y-1 text-right">
                <div className="h-3 bg-neutral-200 rounded w-10 ml-auto" />
                <div className="h-5 bg-neutral-200 rounded w-20 ml-auto" />
            </div>
        </div>
    </div>
);

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState(null);
    const [page, setPage] = useState(1);

    const fetchOrders = useCallback(async (pageNum) => {
        setLoading(true);
        setError(null);
        try {
            const res = await getOrders({ page: pageNum, limit: 10 });
            setOrders(res.data?.data || []);
            setPagination(res.data?.meta?.pagination || null);
            logger.info("Orders fetched", { page: pageNum });
        } catch (err) {
            logger.error("Failed to fetch orders:", err);
            setError("Failed to load orders. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders(page);
    }, [page, fetchOrders]);

    // ── Empty / error states ─────────────────────────────────────────────────

    if (!loading && !error && orders.length === 0) {
        return (
            <div className="min-h-[calc(100vh-4rem)] bg-background-primary flex items-center justify-center px-4">
                <div className="max-w-md mx-auto text-center">
                    <FiShoppingBag className="w-24 h-24 mx-auto mb-6 text-text-secondary/30 stroke-1" />
                    <h2 className="text-2xl lg:text-3xl font-light text-text-primary mb-3">
                        No orders yet
                    </h2>
                    <p className="text-text-secondary mb-8">
                        Your order history will appear here once you place your
                        first order.
                    </p>
                    <Link
                        to="/shop"
                        className="inline-block px-8 py-3 bg-text-primary text-white font-medium rounded-sm hover:bg-text-secondary transition-colors"
                    >
                        EXPLORE COLLECTION
                    </Link>
                </div>
            </div>
        );
    }

    // ── Main layout ──────────────────────────────────────────────────────────

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-background-primary">
            <div className="px-4 lg:px-8 xl:px-16 py-8 lg:py-12">
                {/* Header */}
                <div className="mb-8 lg:mb-10">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-display text-text-primary mb-2">
                        My Orders
                    </h1>
                    {!loading && orders.length > 0 && (
                        <p className="text-sm lg:text-base text-text-secondary">
                            {pagination?.totalOrders ?? orders.length}{" "}
                            {(pagination?.totalOrders ?? orders.length) === 1
                                ? "order"
                                : "orders"}
                        </p>
                    )}
                </div>

                {error && (
                    <div className="text-center py-10">
                        <p className="text-text-secondary mb-3">{error}</p>
                        <button
                            onClick={() => fetchOrders(page)}
                            className="px-6 py-2.5 bg-text-primary text-white text-sm font-medium rounded-sm hover:bg-text-secondary transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Loading skeletons */}
                {loading && !error && (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <OrderSkeleton key={i} />
                        ))}
                    </div>
                )}

                {/* Orders list */}
                {!loading && !error && orders.length > 0 && (
                    <div className="space-y-3">
                        {orders.map((order) => {
                            const itemCount = order.items?.length ?? 0;
                            const firstItem = order.items?.[0];
                            const extraCount = itemCount - 1;
                            return (
                                <Link
                                    key={order._id}
                                    to={`/orders/${order.orderNumber}`}
                                    className="block bg-white border border-neutral-200 rounded-sm p-5 hover:border-text-primary transition-colors"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <p className="font-medium text-text-primary">
                                                {order.orderNumber}
                                            </p>
                                            <p className="text-xs text-text-secondary mt-0.5">
                                                {new Date(
                                                    order.createdAt,
                                                ).toLocaleDateString("en-IN", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </p>
                                            <p className="text-sm text-text-secondary mt-1">
                                                {firstItem?.productName}
                                                {extraCount > 0 && (
                                                    <span className="ml-1 text-text-secondary/60">
                                                        +{extraCount} more
                                                    </span>
                                                )}
                                            </p>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <p className="text-xs text-text-secondary">
                                                Total
                                            </p>
                                            <p className="font-semibold text-text-primary">
                                                {formatPrice(
                                                    order.pricing?.total,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {!loading && pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-8 text-sm">
                        <button
                            disabled={!pagination.hasPrev}
                            onClick={() => setPage((p) => p - 1)}
                            className="px-5 py-2.5 border border-neutral-200 rounded-sm disabled:opacity-40 disabled:cursor-not-allowed hover:border-text-primary transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-text-secondary">
                            Page {pagination.currentPage} of{" "}
                            {pagination.totalPages}
                        </span>
                        <button
                            disabled={!pagination.hasNext}
                            onClick={() => setPage((p) => p + 1)}
                            className="px-5 py-2.5 border border-neutral-200 rounded-sm disabled:opacity-40 disabled:cursor-not-allowed hover:border-text-primary transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;
