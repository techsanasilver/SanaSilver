import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrderByNumber, cancelOrder } from "../api/orders.api";
import { getImageUrl } from "../utils/image.util";
import logger from "../utils/logger.util";

const STATUS_DOT = {
    pending: "bg-neutral-300",
    confirmed: "bg-neutral-400",
    processing: "bg-neutral-500",
    shipped: "bg-text-secondary",
    delivered: "bg-text-primary",
    cancelled: "bg-neutral-300",
};

const STATUS_LABELS = {
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
};

const formatPrice = (amount) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount ?? 0);

// ─── Skeleton ────────────────────────────────────────────────────────────────
const Skeleton = () => (
    <div className="min-h-[calc(100vh-4rem)] bg-background-primary">
        <div className="px-4 lg:px-8 xl:px-16 py-8 lg:py-12 animate-pulse">
            <div className="">
                <div className="flex items-start justify-between mb-8">
                    <div className="space-y-3">
                        <div className="h-8 bg-neutral-200 rounded w-56" />
                        <div className="h-4 bg-neutral-200 rounded w-40" />
                    </div>
                    <div className="h-7 bg-neutral-200 rounded w-24" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white border border-neutral-200 rounded-sm p-5 space-y-4">
                            {[1, 2].map((i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-16 h-16 bg-neutral-200 rounded-sm" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-neutral-200 rounded w-40" />
                                        <div className="h-3 bg-neutral-200 rounded w-24" />
                                    </div>
                                    <div className="h-4 bg-neutral-200 rounded w-16" />
                                </div>
                            ))}
                        </div>
                        <div className="bg-white border border-neutral-200 rounded-sm p-5 space-y-2">
                            <div className="h-4 bg-neutral-200 rounded w-32 mb-3" />
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-3 bg-neutral-200 rounded w-48"
                                />
                            ))}
                        </div>
                    </div>
                    <div className="bg-neutral-100 rounded-sm p-5 space-y-3">
                        <div className="h-4 bg-neutral-200 rounded w-28 mb-3" />
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex justify-between">
                                <div className="h-3 bg-neutral-200 rounded w-20" />
                                <div className="h-3 bg-neutral-200 rounded w-16" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// ─── Cancel Modal ─────────────────────────────────────────────────────────────
const CancelModal = ({ onConfirm, onClose, cancelling }) => {
    const [reason, setReason] = useState("");
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="bg-white rounded-sm p-6 w-full max-w-md shadow-xl">
                <h3 className="text-lg font-semibold text-text-primary mb-1">
                    Cancel Order
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                    Please tell us why you'd like to cancel this order.
                </p>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for cancellation..."
                    rows={3}
                    maxLength={300}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-sm text-sm focus:outline-none focus:border-text-primary resize-none"
                />
                <div className="flex gap-3 mt-4 justify-end">
                    <button
                        onClick={onClose}
                        disabled={cancelling}
                        className="px-5 py-2.5 text-sm border border-neutral-200 rounded-sm hover:border-text-primary disabled:opacity-50 transition-colors"
                    >
                        Go back
                    </button>
                    <button
                        onClick={() => onConfirm(reason.trim())}
                        disabled={!reason.trim() || cancelling}
                        className="px-5 py-2.5 text-sm bg-red-600 text-white rounded-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                        {cancelling ? "Cancelling..." : "Cancel Order"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const OrderDetail = () => {
    const { orderNumber } = useParams();
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            setLoading(true);
            setNotFound(false);
            try {
                const res = await getOrderByNumber(orderNumber);
                setOrder(res.data?.data || null);
                logger.info("Order detail fetched", { orderNumber });
            } catch (err) {
                logger.error("Failed to fetch order:", err);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderNumber]);

    const handleCancel = async (reason) => {
        setCancelling(true);
        setCancelError(null);
        try {
            await cancelOrder(order._id, reason);
            const res = await getOrderByNumber(orderNumber);
            setOrder(res.data?.data || null);
            setShowCancelModal(false);
            logger.info("Order cancelled", { orderNumber });
        } catch (err) {
            const msg =
                err.response?.data?.message || "Failed to cancel order.";
            setCancelError(msg);
            logger.error("Cancel order failed:", err);
        } finally {
            setCancelling(false);
        }
    };

    if (loading) return <Skeleton />;

    if (notFound || !order) {
        return (
            <div className="min-h-[calc(100vh-4rem)] bg-background-primary flex items-center justify-center px-4">
                <div className="text-center">
                    <p className="text-2xl font-display text-text-primary mb-3">
                        Order Not Found
                    </p>
                    <p className="text-text-secondary mb-8">
                        We couldn't find the order you're looking for.
                    </p>
                    <Link
                        to="/orders"
                        className="inline-block py-3 px-8 bg-text-primary text-white font-medium rounded-sm hover:bg-text-secondary transition-colors text-sm"
                    >
                        VIEW MY ORDERS
                    </Link>
                </div>
            </div>
        );
    }

    const status = order.orderStatus;
    const canCancel = ["pending", "confirmed"].includes(status);
    const pricing = order.pricing || {};
    const shippingAddr = order.shippingAddress;

    return (
        <>
            {showCancelModal && (
                <CancelModal
                    onConfirm={handleCancel}
                    onClose={() => {
                        setShowCancelModal(false);
                        setCancelError(null);
                    }}
                    cancelling={cancelling}
                />
            )}

            <div className="min-h-[calc(100vh-4rem)] bg-background-primary">
                <div className="px-4 lg:px-8 xl:px-16 py-8 lg:py-12">
                    <div className="">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-8 lg:mb-10">
                            <div>
                                <h1 className="text-3xl md:text-4xl text-text-primary mb-1">
                                    {order.orderNumber}
                                </h1>
                                <p className="text-sm lg:text-base text-text-secondary">
                                    Placed on{" "}
                                    {new Date(
                                        order.createdAt,
                                    ).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>
                            <span className="self-start inline-flex items-center gap-2 text-sm tracking-widest uppercase text-text-secondary shrink-0">
                                <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status] || "bg-neutral-300"}`}
                                />
                                {STATUS_LABELS[status] || status}
                            </span>
                        </div>

                        {cancelError && (
                            <p className="text-sm text-red-600 mb-5">
                                {cancelError}
                            </p>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left column */}
                            <div className="lg:col-span-2 space-y-5">
                                {/* Items */}
                                <div className="bg-white border border-neutral-200 rounded-sm p-5">
                                    <h2 className="text-base font-semibold text-text-primary mb-4">
                                        Items ({order.items?.length})
                                    </h2>
                                    <div className="space-y-4">
                                        {order.items?.map((item) => {
                                            const variantImg =
                                                item.variant?.images?.find(
                                                    (img) => img.isPrimary,
                                                ) || item.variant?.images?.[0];
                                            const productImg =
                                                item.product?.images?.find(
                                                    (img) => img.isPrimary,
                                                ) || item.product?.images?.[0];
                                            const imgUrl = getImageUrl(
                                                variantImg || productImg,
                                                "small",
                                                "/placeholder.jpg",
                                            );
                                            return (
                                                <div
                                                    key={item._id}
                                                    className="flex gap-4 pb-4 border-b border-neutral-100 last:border-0 last:pb-0"
                                                >
                                                    <img
                                                        src={imgUrl}
                                                        alt={item.productName}
                                                        className="w-16 h-16 object-cover rounded-sm bg-neutral-50 shrink-0"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm text-text-primary truncate">
                                                            {item.productName}
                                                        </p>
                                                        {item.variantName && (
                                                            <p className="text-xs text-text-secondary">
                                                                {
                                                                    item.variantName
                                                                }
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-text-secondary mt-2">
                                                            Qty: {item.quantity}
                                                        </p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="font-semibold text-sm text-text-primary">
                                                            {formatPrice(
                                                                item.total,
                                                            )}
                                                        </p>
                                                        {item.discount > 0 && (
                                                            <p className="text-xs text-text-secondary line-through">
                                                                {formatPrice(
                                                                    item.subtotal +
                                                                        (item.gstAmount ??
                                                                            0),
                                                                )}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-text-secondary/70">
                                                            incl. GST
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Shipping Address */}
                                <div className="bg-white border border-neutral-200 rounded-sm p-5">
                                    <h2 className="text-base font-semibold text-text-primary mb-3">
                                        Shipping Address
                                    </h2>
                                    {shippingAddr ? (
                                        <div className="text-sm text-text-secondary space-y-0.5">
                                            <p className="font-medium text-text-primary">
                                                {shippingAddr.name}
                                            </p>
                                            <p>{shippingAddr.phone}</p>
                                            <p>
                                                {shippingAddr.line1}
                                                {shippingAddr.line2
                                                    ? `, ${shippingAddr.line2}`
                                                    : ""}
                                            </p>
                                            <p>
                                                {shippingAddr.city},{" "}
                                                {shippingAddr.state} –{" "}
                                                {shippingAddr.pincode}
                                            </p>
                                            <p>{shippingAddr.country}</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-text-secondary">
                                            No address on record.
                                        </p>
                                    )}
                                </div>

                                {/* Tracking */}
                                {order.tracking?.trackingNumber && (
                                    <div className="bg-white border border-neutral-200 rounded-sm p-5">
                                        <h2 className="text-base font-semibold text-text-primary mb-3">
                                            Tracking
                                        </h2>
                                        <div className="text-sm text-text-secondary space-y-1">
                                            {order.tracking.courier && (
                                                <p>
                                                    Courier:{" "}
                                                    <span className="text-text-primary font-medium">
                                                        {order.tracking.courier}
                                                    </span>
                                                </p>
                                            )}
                                            <p>
                                                Tracking No.:{" "}
                                                <span className="text-text-primary font-medium">
                                                    {
                                                        order.tracking
                                                            .trackingNumber
                                                    }
                                                </span>
                                            </p>
                                            {order.tracking
                                                .estimatedDelivery && (
                                                <p>
                                                    Est. Delivery:{" "}
                                                    <span className="text-text-primary font-medium">
                                                        {new Date(
                                                            order.tracking
                                                                .estimatedDelivery,
                                                        ).toLocaleDateString(
                                                            "en-IN",
                                                            {
                                                                day: "numeric",
                                                                month: "short",
                                                                year: "numeric",
                                                            },
                                                        )}
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right column — Order Summary */}
                            <div className="space-y-5">
                                <div className="bg-white border border-neutral-200 rounded-sm p-5">
                                    <h2 className="text-base font-semibold text-text-primary mb-4">
                                        Order Summary
                                    </h2>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between text-text-secondary">
                                            <span>Items subtotal</span>
                                            <span>
                                                {formatPrice(
                                                    pricing.itemsSubtotal,
                                                )}
                                            </span>
                                        </div>
                                        {pricing.discount > 0 && (
                                            <div className="flex justify-between text-green-700">
                                                <span>
                                                    Discount
                                                    {order.appliedCoupon
                                                        ?.code && (
                                                        <span className="ml-1 text-xs bg-neutral-100 text-text-secondary px-1.5 py-0.5 rounded-sm">
                                                            {
                                                                order
                                                                    .appliedCoupon
                                                                    .code
                                                            }
                                                        </span>
                                                    )}
                                                </span>
                                                <span>
                                                    −{" "}
                                                    {formatPrice(
                                                        pricing.discount,
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-text-secondary">
                                            <span>Shipping</span>
                                            <span>
                                                {pricing.shippingCharges > 0
                                                    ? formatPrice(
                                                          pricing.shippingCharges,
                                                      )
                                                    : "Free"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-text-secondary">
                                            <span>GST</span>
                                            <span>
                                                {formatPrice(pricing.gst)}
                                            </span>
                                        </div>
                                        <div className="border-t border-neutral-300 pt-3 mt-1 flex justify-between font-bold text-text-primary">
                                            <span>Total</span>
                                            <span>
                                                {formatPrice(pricing.total)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Payment */}
                                    <div className="mt-4 pt-4 border-t border-neutral-300/60">
                                        <p className="text-xs text-text-secondary mb-0.5">
                                            Payment Method
                                        </p>
                                        <p className="text-sm font-medium text-text-primary">
                                            {order.payment?.method === "cod"
                                                ? "Cash on Delivery"
                                                : order.payment?.method ===
                                                    "razorpay"
                                                  ? "Online Payment"
                                                  : order.payment?.method ||
                                                    "—"}
                                        </p>
                                        <p className="text-xs mt-0.5 capitalize text-text-secondary">
                                            {order.payment?.status}
                                        </p>
                                    </div>

                                    {/* Cancel button */}
                                    {canCancel && (
                                        <button
                                            onClick={() =>
                                                setShowCancelModal(true)
                                            }
                                            className="w-full mt-5 px-4 py-2.5 text-sm border border-red-300 text-red-600 rounded-sm hover:bg-red-50 transition-colors"
                                        >
                                            Cancel Order
                                        </button>
                                    )}

                                    {order.customerNote && (
                                        <div className="mt-4 pt-4 border-t border-neutral-300/60">
                                            <p className="text-xs text-text-secondary mb-0.5">
                                                Your Note
                                            </p>
                                            <p className="text-sm text-text-primary">
                                                {order.customerNote}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Back to Orders */}
                                <Link
                                    to="/orders"
                                    className="block text-center px-8 py-3 bg-text-primary text-white font-medium rounded-sm hover:bg-text-secondary transition-colors text-sm"
                                >
                                    MY ORDERS
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OrderDetail;
