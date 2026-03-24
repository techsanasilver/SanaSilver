import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getOrderById } from "../api/orders.api";
import Loader from "../components/common/Loader";
import logger from "../utils/logger.util";

const formatPrice = (amount) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount ?? 0);

const CheckoutSuccess = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get("orderId");
    const orderNumber = searchParams.get("orderNumber");
    const totalFromParams = parseFloat(searchParams.get("total") || "0");

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        logger.info("Checkout success page loaded", { orderId, orderNumber });

        if (!orderId) {
            setLoading(false);
            return;
        }

        const fetchOrder = async () => {
            try {
                const response = await getOrderById(orderId);
                const data = response.data?.data || response.data;
                setOrder(data);
            } catch (err) {
                logger.error("Failed to fetch order details:", err.message);
                // Non-critical — we still show success with URL params
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId, orderNumber]);

    if (loading) {
        return <Loader fullScreen />;
    }

    const displayOrderNumber = order?.orderNumber || orderNumber;
    const displayTotal = order?.pricing?.total || totalFromParams;
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

                    <h1 className="text-3xl font-display text-text-primary mb-2">
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
                                {displayOrderNumber || orderId}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">
                                Total
                            </p>
                            <p className="font-semibold text-lg text-text-primary">
                                {formatPrice(displayTotal)}
                            </p>
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
                                                (item.discountedSubtotal ??
                                                    item.subtotal) *
                                                    item.quantity,
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
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
                    {orderId && (
                        <Link
                            to={`/orders/${orderId}`}
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
