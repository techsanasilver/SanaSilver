import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    MdArrowBack,
    MdRefresh,
    MdPhone,
    MdEmail,
    MdLocationOn,
    MdShoppingBag,
    MdPerson,
    MdToggleOn,
    MdToggleOff,
    MdShoppingCart,
    MdFavorite,
    MdStar,
    MdStarBorder,
    MdRateReview,
    MdHome,
    MdWork,
    MdCheckCircle,
} from "react-icons/md";
import { getCustomerById, toggleCustomerStatus } from "../api/customers.api";
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

const formatDateTime = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

const getOrderStatusColor = (status) => {
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

const StarRating = ({ rating }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) =>
            n <= rating ? (
                <MdStar key={n} className="text-warning text-sm" />
            ) : (
                <MdStarBorder key={n} className="text-text-secondary text-sm" />
            ),
        )}
    </div>
);

const AddressTypeIcon = ({ type }) => {
    if (type === "home") return <MdHome className="text-info text-base" />;
    if (type === "office") return <MdWork className="text-accent text-base" />;
    return <MdLocationOn className="text-text-secondary text-base" />;
};

const getProductImage = (product) => {
    if (!product?.images?.length) return null;
    return (
        product.images.find((img) => img.isPrimary)?.url ||
        product.images[0]?.url ||
        null
    );
};

const CustomerDetail = () => {
    const { customerId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toggling, setToggling] = useState(false);
    const [message, setMessage] = useState(null);

    const fetchCustomer = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getCustomerById(customerId);
            if (response.success) {
                setData(response.data);
            }
        } catch (err) {
            logger.error("Error fetching customer:", err);
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomer();
    }, [customerId]);

    const handleToggleStatus = async () => {
        try {
            setToggling(true);
            const response = await toggleCustomerStatus(customerId);
            if (response.success) {
                setData((prev) => ({
                    ...prev,
                    user: { ...prev.user, isActive: response.data.isActive },
                }));
                setMessage({
                    type: "success",
                    text: `Customer ${response.data.isActive ? "activated" : "deactivated"} successfully`,
                });
                setTimeout(() => setMessage(null), 3000);
            }
        } catch (err) {
            logger.error("Error toggling customer status:", err);
            setMessage({ type: "error", text: handleApiError(err) });
            setTimeout(() => setMessage(null), 4000);
        } finally {
            setToggling(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <button
                    onClick={() => navigate("/customers")}
                    className="flex items-center gap-2 text-text-secondary hover:text-text transition-colors"
                >
                    <MdArrowBack />
                    Back to Customers
                </button>
                <div className="bg-surface rounded-lg shadow-md p-8 text-center">
                    <p className="text-danger">{error}</p>
                    <button
                        onClick={fetchCustomer}
                        className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { user, orders, stats, cart, wishlist, reviews } = data;

    const fullName =
        [user.firstName, user.lastName].filter(Boolean).join(" ") || "—";

    const cartItemCount = cart?.items?.length ?? 0;
    const wishlistItemCount = wishlist?.items?.length ?? 0;

    return (
        <div className="space-y-6">
            {/* Back + Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                    {/* <button
                        onClick={() => navigate("/customers")}
                        className="flex items-center gap-2 text-text-secondary hover:text-text transition-colors"
                    >
                        <MdArrowBack />
                        Back
                    </button> */}
                    <div>
                        <h1 className="text-2xl font-bold text-text">
                            {fullName}
                        </h1>
                        <p className="text-text-secondary text-sm mt-0.5">
                            Customer since {formatDate(user.createdAt)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchCustomer}
                        className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-text-secondary hover:text-text hover:border-accent transition-colors text-sm"
                    >
                        <MdRefresh />
                        Refresh
                    </button>
                    <button
                        onClick={handleToggleStatus}
                        disabled={toggling}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                            user.isActive
                                ? "bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20"
                                : "bg-success/10 text-success hover:bg-success/20 border border-success/20"
                        }`}
                    >
                        {user.isActive ? (
                            <MdToggleOn className="text-lg" />
                        ) : (
                            <MdToggleOff className="text-lg" />
                        )}
                        {user.isActive ? "Deactivate" : "Activate"}
                    </button>
                </div>
            </div>

            {/* Flash message */}
            {message && (
                <div
                    className={`px-4 py-3 rounded-lg text-sm font-medium ${
                        message.type === "success"
                            ? "bg-success/10 text-success border border-success/20"
                            : "bg-danger/10 text-danger border border-danger/20"
                    }`}
                >
                    {message.text}
                </div>
            )}

            {/* Top Grid: Info + Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Customer Info */}
                <div className="lg:col-span-2 bg-surface rounded-lg shadow-md p-6 space-y-5">
                    <h2 className="text-lg font-semibold text-text flex items-center gap-2">
                        <MdPerson className="text-primary" />
                        Customer Info
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <MdPhone className="text-text-secondary mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs text-text-secondary">
                                    Phone
                                </p>
                                <p className="text-sm font-medium text-text">
                                    {user.phone}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <MdEmail className="text-text-secondary mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs text-text-secondary">
                                    Email
                                </p>
                                <p className="text-sm font-medium text-text">
                                    {user.email || "—"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 sm:col-span-2">
                            <div>
                                <p className="text-xs text-text-secondary mb-1">
                                    Status
                                </p>
                                <span
                                    className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                                        user.isActive
                                            ? "bg-success/10 text-success"
                                            : "bg-danger/10 text-danger"
                                    }`}
                                >
                                    {user.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>
                        </div>

                        {user.lastLoginAt && (
                            <div className="sm:col-span-2">
                                <p className="text-xs text-text-secondary">
                                    Last Login
                                </p>
                                <p className="text-sm font-medium text-text">
                                    {formatDateTime(user.lastLoginAt)}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Quick counts */}
                    <div className="pt-4 border-t border-border grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-lg font-bold text-text">
                                {user.addresses?.length ?? 0}
                            </p>
                            <p className="text-xs text-text-secondary">
                                Saved Addresses
                            </p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-text">
                                {cartItemCount}
                            </p>
                            <p className="text-xs text-text-secondary">
                                Cart Items
                            </p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-text">
                                {wishlistItemCount}
                            </p>
                            <p className="text-xs text-text-secondary">
                                Wishlist Items
                            </p>
                        </div>
                    </div>
                </div>

                {/* Order Stats */}
                <div className="bg-surface rounded-lg shadow-md p-6">
                    <h2 className="text-lg font-semibold text-text flex items-center gap-2 mb-4">
                        <MdShoppingBag className="text-accent" />
                        Order Summary
                    </h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-text-secondary">
                                Total Orders
                            </p>
                            <p className="text-lg font-bold text-text">
                                {stats.totalOrders}
                            </p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-text-secondary">
                                Total Spent
                            </p>
                            <p className="text-lg font-bold text-accent">
                                {formatCurrency(stats.totalSpent)}
                            </p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-text-secondary">
                                Avg Order Value
                            </p>
                            <p className="text-sm font-medium text-text">
                                {formatCurrency(stats.avgOrderValue)}
                            </p>
                        </div>
                        <div className="pt-3 border-t border-border space-y-2">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-text-secondary">
                                    Delivered
                                </p>
                                <span className="text-sm font-medium text-success">
                                    {stats.deliveredCount}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-text-secondary">
                                    Cancelled
                                </p>
                                <span className="text-sm font-medium text-danger">
                                    {stats.cancelledCount}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Saved Addresses */}
            {user.addresses?.length > 0 && (
                <div className="bg-surface rounded-lg shadow-md p-6">
                    <h2 className="text-lg font-semibold text-text flex items-center gap-2 mb-4">
                        <MdLocationOn className="text-primary" />
                        Saved Addresses
                        <span className="text-sm font-normal text-text-secondary">
                            ({user.addresses.length})
                        </span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {user.addresses.map((addr) => (
                            <div
                                key={addr._id}
                                className={`p-4 rounded-lg border ${
                                    addr.isDefault
                                        ? "border-primary/30 bg-primary/5"
                                        : "border-border bg-background"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <AddressTypeIcon type={addr.type} />
                                        <span className="text-xs font-semibold text-text capitalize">
                                            {addr.type || "other"}
                                        </span>
                                    </div>
                                    {addr.isDefault && (
                                        <span className="flex items-center gap-0.5 text-xs font-semibold text-primary">
                                            <MdCheckCircle className="text-sm" />
                                            Default
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm font-medium text-text">
                                    {addr.name}
                                </p>
                                <p className="text-xs text-text-secondary mt-0.5">
                                    {addr.addressLine1}
                                    {addr.addressLine2
                                        ? `, ${addr.addressLine2}`
                                        : ""}
                                </p>
                                {addr.landmark && (
                                    <p className="text-xs text-text-secondary">
                                        Near {addr.landmark}
                                    </p>
                                )}
                                <p className="text-xs text-text-secondary">
                                    {addr.city}, {addr.state} – {addr.pincode}
                                </p>
                                <p className="text-xs text-text-secondary mt-1">
                                    {addr.phone}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Cart + Wishlist */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cart */}
                <div className="bg-surface rounded-lg shadow-md p-6">
                    <h2 className="text-lg font-semibold text-text flex items-center gap-2 mb-4">
                        <MdShoppingCart className="text-accent" />
                        Cart
                        <span className="text-sm font-normal text-text-secondary">
                            ({cartItemCount} item
                            {cartItemCount !== 1 ? "s" : ""})
                        </span>
                    </h2>

                    {cartItemCount === 0 ? (
                        <p className="text-text-secondary text-sm text-center py-6">
                            Cart is empty
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {cart.items.map((item, idx) => {
                                const img = getProductImage(item.productId);
                                return (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                                    >
                                        {img ? (
                                            <img
                                                src={img}
                                                alt={item.productId?.name || ""}
                                                className="w-12 h-12 object-cover rounded-md shrink-0"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-md bg-border/30 shrink-0 flex items-center justify-center">
                                                <MdShoppingCart className="text-text-secondary text-lg" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-text truncate">
                                                {item.productId?.name || "—"}
                                            </p>
                                            <p className="text-xs text-text-secondary truncate">
                                                {item.variantId?.variantName ||
                                                    "—"}
                                            </p>
                                            {item.variantId?.attributes
                                                ?.length > 0 && (
                                                <p className="text-xs text-text-secondary">
                                                    {item.variantId.attributes
                                                        .map(
                                                            (a) =>
                                                                `${a.key}: ${a.value}`,
                                                        )
                                                        .join(", ")}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-semibold text-text">
                                                {formatCurrency(
                                                    item.variantId
                                                        ?.sellingPrice,
                                                )}
                                            </p>
                                            <p className="text-xs text-text-secondary">
                                                Qty: {item.quantity}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {cart?.lastActivityAt && (
                        <p className="text-xs text-text-secondary mt-3 pt-3 border-t border-border">
                            Last updated {formatDateTime(cart.lastActivityAt)}
                        </p>
                    )}
                </div>

                {/* Wishlist */}
                <div className="bg-surface rounded-lg shadow-md p-6">
                    <h2 className="text-lg font-semibold text-text flex items-center gap-2 mb-4">
                        <MdFavorite className="text-danger" />
                        Wishlist
                        <span className="text-sm font-normal text-text-secondary">
                            ({wishlistItemCount} item
                            {wishlistItemCount !== 1 ? "s" : ""})
                        </span>
                    </h2>

                    {wishlistItemCount === 0 ? (
                        <p className="text-text-secondary text-sm text-center py-6">
                            Wishlist is empty
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {wishlist.items.map((item) => {
                                const img = getProductImage(item.productId);
                                return (
                                    <div
                                        key={item._id}
                                        className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                                    >
                                        {img ? (
                                            <img
                                                src={img}
                                                alt={item.productId?.name || ""}
                                                className="w-12 h-12 object-cover rounded-md shrink-0"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-md bg-border/30 shrink-0 flex items-center justify-center">
                                                <MdFavorite className="text-danger/40 text-lg" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-text truncate">
                                                {item.productId?.name || "—"}
                                            </p>
                                            <p className="text-xs text-text-secondary truncate">
                                                {item.variantId?.variantName ||
                                                    "—"}
                                            </p>
                                            {item.variantId?.attributes
                                                ?.length > 0 && (
                                                <p className="text-xs text-text-secondary">
                                                    {item.variantId.attributes
                                                        .map(
                                                            (a) =>
                                                                `${a.key}: ${a.value}`,
                                                        )
                                                        .join(", ")}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-semibold text-text">
                                                {formatCurrency(
                                                    item.variantId
                                                        ?.sellingPrice,
                                                )}
                                            </p>
                                            {item.addedAt && (
                                                <p className="text-xs text-text-secondary">
                                                    {formatDate(item.addedAt)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Reviews */}
            {reviews?.length > 0 && (
                <div className="bg-surface rounded-lg shadow-md p-6">
                    <h2 className="text-lg font-semibold text-text flex items-center gap-2 mb-4">
                        <MdRateReview className="text-info" />
                        Reviews
                        <span className="text-sm font-normal text-text-secondary">
                            ({reviews.length})
                        </span>
                    </h2>
                    <div className="space-y-4">
                        {reviews.map((review) => {
                            const img = getProductImage(review.product);
                            return (
                                <div
                                    key={review._id}
                                    className="flex gap-4 py-4 border-b border-border last:border-0"
                                >
                                    {img ? (
                                        <img
                                            src={img}
                                            alt={review.product?.name || ""}
                                            className="w-14 h-14 object-cover rounded-md shrink-0"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-md bg-border/30 shrink-0 flex items-center justify-center">
                                            <MdRateReview className="text-text-secondary text-lg" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 flex-wrap">
                                            <div>
                                                <p className="text-sm font-medium text-text">
                                                    {review.product?.name ||
                                                        "Product"}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <StarRating
                                                        rating={review.rating}
                                                    />
                                                    <span className="text-xs text-text-secondary">
                                                        {formatDate(
                                                            review.createdAt,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {review.isVerifiedPurchase && (
                                                    <span className="flex items-center gap-0.5 text-xs font-semibold text-success">
                                                        <MdCheckCircle className="text-sm" />
                                                        Verified
                                                    </span>
                                                )}
                                                <span
                                                    className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                                                        review.status ===
                                                        "approved"
                                                            ? "bg-success/10 text-success"
                                                            : "bg-danger/10 text-danger"
                                                    }`}
                                                >
                                                    {review.status}
                                                </span>
                                            </div>
                                        </div>
                                        {review.title && (
                                            <p className="text-sm font-semibold text-text mt-1.5">
                                                {review.title}
                                            </p>
                                        )}
                                        <p className="text-sm text-text-secondary mt-1 line-clamp-3">
                                            {review.body}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Recent Orders */}
            <div className="bg-surface rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-text mb-4">
                    Order History
                </h2>

                {orders.length === 0 ? (
                    <p className="text-text-secondary text-sm text-center py-6">
                        No orders placed yet
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left px-3 py-2 text-sm font-semibold text-text-secondary">
                                        Order #
                                    </th>
                                    <th className="text-left px-3 py-2 text-sm font-semibold text-text-secondary hidden sm:table-cell">
                                        Date
                                    </th>
                                    <th className="text-left px-3 py-2 text-sm font-semibold text-text-secondary">
                                        Status
                                    </th>
                                    <th className="text-left px-3 py-2 text-sm font-semibold text-text-secondary hidden sm:table-cell">
                                        Payment
                                    </th>
                                    <th className="text-right px-3 py-2 text-sm font-semibold text-text-secondary">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {orders.map((order) => (
                                    <tr
                                        key={order._id}
                                        onClick={() =>
                                            navigate(`/orders/${order._id}`)
                                        }
                                        className="hover:bg-background cursor-pointer transition-colors"
                                    >
                                        <td className="px-3 py-3 text-sm font-medium text-text">
                                            {order.orderNumber}
                                        </td>
                                        <td className="px-3 py-3 text-sm text-text-secondary hidden sm:table-cell">
                                            {formatDate(order.createdAt)}
                                        </td>
                                        <td className="px-3 py-3">
                                            <span
                                                className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getOrderStatusColor(order.orderStatus)}`}
                                            >
                                                {order.orderStatus}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 hidden sm:table-cell">
                                            <span
                                                className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                                                    order.payment?.status ===
                                                    "paid"
                                                        ? "bg-success/10 text-success"
                                                        : order.payment
                                                                ?.status ===
                                                            "failed"
                                                          ? "bg-danger/10 text-danger"
                                                          : "bg-warning/10 text-warning"
                                                }`}
                                            >
                                                {order.payment?.status ||
                                                    "pending"}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-sm font-semibold text-text text-right">
                                            {formatCurrency(
                                                order.pricing?.total,
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerDetail;
