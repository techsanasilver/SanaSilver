import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getOrderByNumber } from "../api/orders.api";
import logger from "../utils/logger.util";

const formatPrice = (amount) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount ?? 0);

const CheckoutSuccess = () => {
    const [searchParams] = useSearchParams();
    const orderNumber = searchParams.get("orderNumber");

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        logger.info("Checkout success page loaded", { orderNumber });

        if (!orderNumber) {
            setNotFound(true);
            setLoading(false);
            return;
        }

        const fetchOrder = async () => {
            try {
                const response = await getOrderByNumber(orderNumber);
                const data = response.data?.data || response.data;
                if (!data) {
                    setNotFound(true);
                } else {
                    setOrder(data);
                }
            } catch (err) {
                logger.error("Failed to fetch order details:", err.message);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderNumber]);

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] bg-background-primary">
                <div className="max-w-2xl mx-auto px-4 py-12 lg:py-20 animate-pulse">
                    {/* Icon + heading */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-neutral-200 rounded-full mx-auto mb-5" />
                        <div className="h-8 bg-neutral-200 rounded w-48 mx-auto mb-2" />
                        <div className="h-4 bg-neutral-200 rounded w-64 mx-auto" />
                    </div>

                    {/* Card */}
                    <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden mb-6">
                        {/* Order number + total */}
                        <div className="px-6 py-5 border-b border-neutral-100 flex justify-between">
                            <div className="space-y-2">
                                <div className="h-3 bg-neutral-200 rounded w-12" />
                                <div className="h-4 bg-neutral-200 rounded w-36" />
                            </div>
                            <div className="space-y-2 text-right">
                                <div className="h-3 bg-neutral-200 rounded w-10 ml-auto" />
                                <div className="h-6 bg-neutral-200 rounded w-24 ml-auto" />
                            </div>
                        </div>

                        {/* Items */}
                        <div className="px-6 py-4 border-b border-neutral-100 space-y-3">
                            <div className="h-3 bg-neutral-200 rounded w-20 mb-3" />
                            {[1, 2].map((i) => (
                                <div key={i} className="flex justify-between">
                                    <div className="h-4 bg-neutral-200 rounded w-48" />
                                    <div className="h-4 bg-neutral-200 rounded w-20" />
                                </div>
                            ))}
                        </div>

                        {/* Address */}
                        <div className="px-6 py-4 space-y-2">
                            <div className="h-3 bg-neutral-200 rounded w-24 mb-2" />
                            <div className="h-4 bg-neutral-200 rounded w-40" />
                            <div className="h-4 bg-neutral-200 rounded w-56" />
                            <div className="h-4 bg-neutral-200 rounded w-48" />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 h-11 bg-neutral-200 rounded-sm" />
                        <div className="flex-1 h-11 bg-neutral-200 rounded-sm" />
                    </div>
                </div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-[calc(100vh-4rem)] bg-background-primary flex items-center justify-center">
                <div className="text-center px-4">
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

    const displayOrderNumber = order?.orderNumber || orderNumber;
    const displayTotal = order?.pricing?.total;
    const gstTotal = order?.pricing?.gstAmount;
    const shippingAddress = order?.shippingAddress;
    const items = order?.items || [];

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-background-primary">
            <div className="max-w-2xl mx-auto px-4 py-12 lg:py-20">
                {/* Success icon */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                        <svg
                            className="w-8 h-8 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>

                    <h1 className="text-3xl font-display font-medium text-text-primary mb-2">
                        Order Placed!
                    </h1>
                    <p className="text-text-secondary">
                        Thank you for your order. We'll get it ready soon.
                    </p>
                </div>

                {/* Order summary card */}
                <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden mb-6">
                    {/* Order number + total */}
                    <div className="px-6 py-5 border-b border-neutral-100 flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">
                                Order
                            </p>
                            <p className="font-medium text-text-primary font-mono">
                                {displayOrderNumber}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">
                                Total
                            </p>
                            <p className="font-semibold text-lg text-text-primary">
                                {formatPrice(displayTotal)}
                            </p>
                            {gstTotal > 0 && (
                                <p className="text-xs text-text-secondary mt-0.5">
                                    incl. GST {formatPrice(gstTotal)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Items */}
                    {items.length > 0 && (
                        <div className="px-6 py-4 border-b border-neutral-100">
                            <p className="text-xs text-text-secondary uppercase tracking-wider mb-3">
                                Items ({items.length})
                            </p>
                            <div className="space-y-2">
                                {items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex justify-between text-sm"
                                    >
                                        <span className="text-text-secondary truncate mr-4">
                                            {item.productName} × {item.quantity}
                                        </span>
                                        <span className="font-medium text-text-primary shrink-0">
                                            {formatPrice(
                                                item.sellingPrice *
                                                    item.quantity,
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {order.appliedCoupon?.code &&
                                order.pricing?.discount > 0 && (
                                    <div className="flex justify-between text-sm mt-3 pt-3 border-t border-neutral-100">
                                        <span className="text-text-secondary">
                                            Coupon{" "}
                                            <span className="bg-neutral-100 text-text-secondary px-1.5 py-0.5 rounded-sm text-xs ml-1">
                                                {order.appliedCoupon.code}
                                            </span>
                                        </span>
                                        <span className="text-text-primary font-medium shrink-0">
                                            −{" "}
                                            {formatPrice(
                                                order.pricing.discount,
                                            )}
                                        </span>
                                    </div>
                                )}
                        </div>
                    )}

                    {/* Delivery address */}
                    {shippingAddress && (
                        <div className="px-6 py-4">
                            <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">
                                Delivering to
                            </p>
                            <p className="text-sm font-medium text-text-primary">
                                {shippingAddress.name}
                            </p>
                            <p className="text-sm text-text-secondary">
                                {shippingAddress.line1}
                                {shippingAddress.line2 &&
                                    `, ${shippingAddress.line2}`}
                            </p>
                            <p className="text-sm text-text-secondary">
                                {shippingAddress.city}, {shippingAddress.state}{" "}
                                — {shippingAddress.pincode}
                            </p>
                        </div>
                    )}
                </div>

                {/* Payment note */}
                <p className="text-sm text-center text-text-secondary mb-8">
                    Payment will be collected when your order is delivered.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {orderNumber && (
                        <Link
                            to={`/orders/${orderNumber}`}
                            className="flex-1 py-3 bg-text-primary text-white text-center font-medium rounded-sm hover:bg-text-secondary transition-colors text-sm"
                        >
                            VIEW ORDER DETAILS
                        </Link>
                    )}
                    <Link
                        to="/shop"
                        className="flex-1 py-3 border border-neutral-300 text-text-primary text-center font-medium rounded-sm hover:border-text-primary transition-colors text-sm"
                    >
                        CONTINUE SHOPPING
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CheckoutSuccess;
