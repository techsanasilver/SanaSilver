import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    MdArrowBack,
    MdEdit,
    MdLocalShipping,
    MdCheck,
    MdCancel,
    MdNote,
    MdRefresh,
    MdShoppingCart,
    MdPayment,
    MdLocationOn,
    MdPhone,
    MdEmail,
    MdReceiptLong,
} from "react-icons/md";
import {
    getOrderById,
    updateOrderStatus,
    addShippingDetails,
    markAsDelivered,
    cancelOrder,
    addAdminNote,
} from "../api/orders.api";
import {
    getInvoiceForOrder,
    generateInvoice,
    downloadInvoicePDF,
} from "../api/invoices.api";
import { handleApiError } from "../utils/axios";
import logger from "../utils/logger.util";
import Loader from "../components/common/Loader";

const OrderDetail = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // Invoice state — null: not yet fetched, false: doesn't exist, Object: invoice metadata
    const [invoice, setInvoice] = useState(null);
    const [invoiceLoading, setInvoiceLoading] = useState(false);

    // Modal states
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showShippingModal, setShowShippingModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showDeliveredModal, setShowDeliveredModal] = useState(false);

    // Form states
    const [statusForm, setStatusForm] = useState({ status: "", note: "" });
    const [shippingForm, setShippingForm] = useState({
        courier: "",
        trackingNumber: "",
        estimatedDelivery: "",
    });
    const [cancelForm, setCancelForm] = useState({ reason: "" });
    const [noteForm, setNoteForm] = useState({ note: "" });

    // Fetch order details
    const fetchOrder = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getOrderById(orderId);
            if (response.success) {
                setOrder(response.data);
            }
        } catch (err) {
            logger.error("Error fetching order:", err);
            const errorMessage = handleApiError(err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Fetch invoice status for this order
    const fetchInvoice = async () => {
        try {
            const response = await getInvoiceForOrder(orderId);
            // API returns null data when no invoice exists (not a 404)
            setInvoice(response.data ?? false);
        } catch (err) {
            logger.warn("Could not fetch invoice status:", err);
            setInvoice(false);
        }
    };

    useEffect(() => {
        fetchOrder();
        fetchInvoice();
    }, [orderId]);

    // Clear message after 5 seconds
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    // Handle status update
    const handleStatusUpdate = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            const response = await updateOrderStatus(orderId, statusForm);
            if (response.success) {
                setMessage({
                    type: "success",
                    text: "Order status updated successfully",
                });
                setShowStatusModal(false);
                setStatusForm({ status: "", note: "" });
                fetchOrder();
            }
        } catch (err) {
            logger.error("Error updating status:", err);
            setMessage({
                type: "error",
                text: handleApiError(err),
            });
        } finally {
            setActionLoading(false);
        }
    };

    // Handle shipping details
    const handleShippingSubmit = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            const response = await addShippingDetails(orderId, shippingForm);
            if (response.success) {
                setMessage({
                    type: "success",
                    text: "Shipping details added successfully",
                });
                setShowShippingModal(false);
                setShippingForm({
                    courier: "",
                    trackingNumber: "",
                    estimatedDelivery: "",
                });
                fetchOrder();
            }
        } catch (err) {
            logger.error("Error adding shipping:", err);
            setMessage({
                type: "error",
                text: handleApiError(err),
            });
        } finally {
            setActionLoading(false);
        }
    };

    // Handle mark as delivered
    const handleMarkDelivered = async () => {
        try {
            setActionLoading(true);
            const response = await markAsDelivered(orderId);
            if (response.success) {
                setMessage({
                    type: "success",
                    text: "Order marked as delivered",
                });
                fetchOrder();
            }
        } catch (err) {
            logger.error("Error marking delivered:", err);
            setMessage({
                type: "error",
                text: handleApiError(err),
            });
        } finally {
            setActionLoading(false);
        }
    };

    // Handle cancel order
    const handleCancelOrder = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            const response = await cancelOrder(orderId, cancelForm.reason);
            if (response.success) {
                setMessage({
                    type: "success",
                    text: "Order cancelled successfully",
                });
                setShowCancelModal(false);
                setCancelForm({ reason: "" });
                fetchOrder();
            }
        } catch (err) {
            logger.error("Error cancelling order:", err);
            setMessage({
                type: "error",
                text: handleApiError(err),
            });
        } finally {
            setActionLoading(false);
        }
    };

    // Handle add note
    const handleAddNote = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            const response = await addAdminNote(orderId, noteForm.note);
            if (response.success) {
                setMessage({
                    type: "success",
                    text: "Note added successfully",
                });
                setShowNoteModal(false);
                setNoteForm({ note: "" });
                fetchOrder();
            }
        } catch (err) {
            logger.error("Error adding note:", err);
            setMessage({
                type: "error",
                text: handleApiError(err),
            });
        } finally {
            setActionLoading(false);
        }
    };

    // Handle generate invoice
    const handleGenerateInvoice = async () => {
        try {
            setInvoiceLoading(true);
            const response = await generateInvoice(orderId);
            if (response.success) {
                setInvoice(response.data);
                setMessage({
                    type: "success",
                    text: "Invoice generated successfully",
                });
            }
        } catch (err) {
            // 409 = invoice already exists; fetch it
            if (
                err.response?.status === 409 &&
                err.response?.data?.data?.invoiceId
            ) {
                setInvoice(err.response.data.data);
                setMessage({ type: "success", text: "Invoice already exists" });
            } else {
                logger.error("Error generating invoice:", err);
                setMessage({ type: "error", text: handleApiError(err) });
            }
        } finally {
            setInvoiceLoading(false);
        }
    };

    // Handle download invoice PDF
    const handleDownloadInvoice = async () => {
        if (!invoice?.invoiceId && !invoice?._id) return;
        try {
            setInvoiceLoading(true);
            const invoiceId = invoice.invoiceId || invoice._id;
            const response = await downloadInvoicePDF(invoiceId);
            const url = URL.createObjectURL(
                new Blob([response.data], { type: "application/pdf" }),
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = `Invoice-${invoice.invoiceNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            logger.error("Error downloading invoice:", err);
            setMessage({ type: "error", text: "Failed to download invoice" });
        } finally {
            setInvoiceLoading(false);
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Get status color
    const getStatusColor = (status) => {
        const colors = {
            pending: "bg-warning/10 text-warning",
            confirmed: "bg-info/10 text-info",
            processing: "bg-primary/10 text-primary",
            shipped: "bg-info/10 text-info",
            delivered: "bg-success/10 text-success",
            cancelled: "bg-danger/10 text-danger",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    // Get payment status color
    const getPaymentStatusColor = (status) => {
        const colors = {
            pending: "bg-warning/10 text-warning",
            paid: "bg-success/10 text-success",
            failed: "bg-danger/10 text-danger",
            refunded: "bg-gray-100 text-gray-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-danger/10 border border-danger/20 rounded-lg p-4">
                    <p className="text-danger">{error}</p>
                    <button
                        onClick={fetchOrder}
                        className="mt-4 px-4 py-2 bg-danger text-white rounded-lg hover:bg-danger/90"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/orders")}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <MdArrowBack className="text-2xl" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Order #{order.orderNumber}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Placed on {formatDate(order.createdAt)}
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchOrder}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <MdRefresh className="text-lg" />
                    Refresh
                </button>
            </div>

            {/* Message */}
            {message && (
                <div
                    className={`p-4 rounded-lg ${message.type === "success" ? "bg-success/10 text-success border border-success/20" : "bg-danger/10 text-danger border border-danger/20"}`}
                >
                    {message.text}
                </div>
            )}

            {/* Status and Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Current Status */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                        Order Status
                    </h3>
                    <span
                        className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}
                    >
                        {order.orderStatus?.toUpperCase()}
                    </span>
                </div>

                {/* Payment Status */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                        Payment Status
                    </h3>
                    <span
                        className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPaymentStatusColor(order.payment?.status)}`}
                    >
                        {order.payment?.status?.replace("_", " ").toUpperCase()}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                        {order.payment?.method === "cod"
                            ? "Cash on Delivery"
                            : "Online Payment"}
                    </p>
                </div>

                {/* Total Amount */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                        Total Amount
                    </h3>
                    <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(order.pricing?.total || 0)}
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => {
                        setStatusForm({ status: order.orderStatus, note: "" });
                        setShowStatusModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                    <MdEdit />
                    Update Status
                </button>
                {order.orderStatus !== "shipped" &&
                    order.orderStatus !== "delivered" &&
                    order.orderStatus !== "cancelled" && (
                        <button
                            onClick={() => setShowShippingModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-info text-white rounded-lg hover:bg-info/90 transition-colors"
                        >
                            <MdLocalShipping />
                            Add Shipping
                        </button>
                    )}
                {order.orderStatus === "shipped" && (
                    <button
                        onClick={() => setShowDeliveredModal(true)}
                        disabled={actionLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 transition-colors disabled:opacity-50"
                    >
                        <MdCheck />
                        Mark Delivered
                    </button>
                )}
                {order.orderStatus !== "cancelled" &&
                    order.orderStatus !== "delivered" && (
                        <button
                            onClick={() => setShowCancelModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-danger text-white rounded-lg hover:bg-danger/90 transition-colors"
                        >
                            <MdCancel />
                            Cancel Order
                        </button>
                    )}
                <button
                    onClick={() => setShowNoteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                    <MdNote />
                    Add Note
                </button>
                {invoice ? (
                    <button
                        onClick={handleDownloadInvoice}
                        disabled={invoiceLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors disabled:opacity-50"
                    >
                        <MdReceiptLong />
                        {invoiceLoading ? "Downloading..." : "Download Invoice"}
                    </button>
                ) : (
                    <button
                        onClick={handleGenerateInvoice}
                        disabled={invoiceLoading || invoice === null}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                    >
                        <MdReceiptLong />
                        {invoiceLoading
                            ? "Generating..."
                            : invoice === null
                              ? "Checking..."
                              : "Generate Invoice"}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Order Items & Pricing */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <MdShoppingCart />
                                Order Items ({order.items?.length || 0})
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {order.items?.map((item, index) => (
                                <div key={index} className="p-6">
                                    <div className="flex gap-4">
                                        {/* Product Image */}
                                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                            {(() => {
                                                const imgSrc =
                                                    item.variant?.images?.[0]
                                                        ?.url ||
                                                    item.product?.images?.[0]
                                                        ?.url ||
                                                    (item.image?.startsWith(
                                                        "http",
                                                    )
                                                        ? item.image
                                                        : null);
                                                return imgSrc ? (
                                                    <img
                                                        src={imgSrc}
                                                        alt={
                                                            item.productName ||
                                                            item.product?.name
                                                        }
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        No Image
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Product Details */}
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">
                                                {item.productName ||
                                                    item.product?.name ||
                                                    "Product Deleted"}
                                            </h3>
                                            <div className="mt-1 space-y-1 text-sm text-gray-600">
                                                {item.variantName && (
                                                    <p className="text-gray-500">
                                                        {item.variantName}
                                                    </p>
                                                )}
                                                {item.sku && (
                                                    <p>SKU: {item.sku}</p>
                                                )}
                                                <p>Quantity: {item.quantity}</p>
                                                <p>
                                                    Unit Price (incl. GST):{" "}
                                                    {formatCurrency(
                                                        item.sellingPrice,
                                                    )}
                                                </p>
                                                {item.gstRate > 0 && (
                                                    <p>
                                                        GST Rate: {item.gstRate}
                                                        %
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Item Total */}
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">
                                                {formatCurrency(
                                                    item.baseAmount,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pricing Breakdown */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <MdPayment />
                            Pricing Breakdown
                        </h2>
                        <div className="space-y-3">
                            <div className="flex justify-between text-gray-700">
                                <span>Items Subtotal (excl. GST):</span>
                                <span>
                                    {formatCurrency(
                                        order.pricing?.itemsSubtotal || 0,
                                    )}
                                </span>
                            </div>
                            {order.pricing?.discount > 0 && (
                                <>
                                    <div className="flex justify-between text-success">
                                        <span className="flex items-center gap-2">
                                            Coupon Discount (excl. GST):
                                            {order.appliedCoupon?.code && (
                                                <span className="text-xs font-medium bg-success/10 px-1.5 py-0.5 rounded">
                                                    {order.appliedCoupon.code}
                                                </span>
                                            )}
                                        </span>
                                        <span>
                                            -{" "}
                                            {formatCurrency(
                                                (order.pricing.itemsSubtotal ||
                                                    0) -
                                                    (order.pricing
                                                        .discountedSubtotal ||
                                                        0),
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-gray-700">
                                        <span>
                                            Discounted Subtotal (excl. GST):
                                        </span>
                                        <span>
                                            {formatCurrency(
                                                order.pricing
                                                    ?.discountedSubtotal || 0,
                                            )}
                                        </span>
                                    </div>
                                </>
                            )}
                            <div className="flex justify-between text-gray-700">
                                <span>Shipping Charges:</span>
                                <span>
                                    {formatCurrency(
                                        order.pricing?.shippingCharges || 0,
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                                <span>GST:</span>
                                <span>
                                    {formatCurrency(order.pricing?.gst || 0)}
                                </span>
                            </div>
                            <div className="pt-3 border-t border-gray-200">
                                <div className="flex justify-between text-lg font-bold text-gray-900">
                                    <span>Total:</span>
                                    <span>
                                        {formatCurrency(
                                            order.pricing?.total || 0,
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tracking */}
                    {order.tracking?.courier && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <MdLocalShipping />
                                Shipping Details
                            </h2>
                            <div className="space-y-2 text-gray-700">
                                <p>
                                    <span className="font-medium">
                                        Courier:
                                    </span>{" "}
                                    {order.tracking.courier}
                                </p>
                                <p>
                                    <span className="font-medium">
                                        Tracking Number:
                                    </span>{" "}
                                    {order.tracking.trackingNumber}
                                </p>
                                {order.tracking.estimatedDelivery && (
                                    <p>
                                        <span className="font-medium">
                                            Estimated Delivery:
                                        </span>{" "}
                                        {formatDate(
                                            order.tracking.estimatedDelivery,
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Admin Notes */}
                    {order.notes && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <MdNote />
                                Admin Notes
                            </h2>
                            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                                {order.notes}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Right Column - Customer & Address */}
                <div className="space-y-6">
                    {/* Customer Information */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold mb-4">Customer</h2>
                        <div className="space-y-3">
                            {(order.customer?.firstName ||
                                order.customer?.lastName) && (
                                <div className="flex items-start gap-3">
                                    <div className="w-4 mt-1 shrink-0" />
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Name
                                        </p>
                                        <p className="text-gray-900">
                                            {[
                                                order.customer.firstName,
                                                order.customer.lastName,
                                            ]
                                                .filter(Boolean)
                                                .join(" ")}
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start gap-3">
                                <MdEmail className="text-gray-400 mt-1" />
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Email
                                    </p>
                                    <p className="text-gray-900">
                                        {order.customer?.email || "N/A"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MdPhone className="text-gray-400 mt-1" />
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Phone
                                    </p>
                                    <p className="text-gray-900">
                                        {order.customer?.phone ||
                                            order.shippingAddress?.phone ||
                                            "N/A"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <MdLocationOn />
                            Shipping Address
                        </h2>
                        {order.shippingAddress ? (
                            <div className="text-gray-700 space-y-1">
                                <p className="font-medium">
                                    {order.shippingAddress.name}
                                </p>
                                <p>{order.shippingAddress.line1}</p>
                                {order.shippingAddress.line2 && (
                                    <p>{order.shippingAddress.line2}</p>
                                )}
                                <p>
                                    {order.shippingAddress.city},{" "}
                                    {order.shippingAddress.state} -{" "}
                                    {order.shippingAddress.pincode}
                                </p>
                                <p>{order.shippingAddress.country}</p>
                                <p className="mt-2">
                                    Phone: {order.shippingAddress.phone}
                                </p>
                            </div>
                        ) : (
                            <p className="text-gray-500">No address provided</p>
                        )}
                    </div>

                    {/* Billing Address */}
                    {order.billingAddress && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold mb-4">
                                Billing Address
                            </h2>
                            <div className="text-gray-700 space-y-1">
                                <p className="font-medium">
                                    {order.billingAddress.name}
                                </p>
                                <p>{order.billingAddress.line1}</p>
                                {order.billingAddress.line2 && (
                                    <p>{order.billingAddress.line2}</p>
                                )}
                                <p>
                                    {order.billingAddress.city},{" "}
                                    {order.billingAddress.state} -{" "}
                                    {order.billingAddress.pincode}
                                </p>
                                <p>{order.billingAddress.country}</p>
                            </div>
                        </div>
                    )}

                    {/* Order Timeline */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold mb-4">Timeline</h2>
                        <div className="space-y-3">
                            {order.statusHistory?.map((history, index) => (
                                <div
                                    key={index}
                                    className="flex gap-3 pb-3 border-b border-gray-100 last:border-0"
                                >
                                    <div
                                        className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(history.status).split(" ")[0]}`}
                                    ></div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">
                                            {history.status?.toUpperCase()}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatDate(history.timestamp)}
                                        </p>
                                        {history.note && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                {history.note}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Update Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-semibold mb-4">
                            Update Order Status
                        </h3>
                        <form
                            onSubmit={handleStatusUpdate}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    New Status *
                                </label>
                                <select
                                    value={statusForm.status}
                                    onChange={(e) =>
                                        setStatusForm({
                                            ...statusForm,
                                            status: e.target.value,
                                        })
                                    }
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">Select Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="processing">
                                        Processing
                                    </option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Note (Optional)
                                </label>
                                <textarea
                                    value={statusForm.note}
                                    onChange={(e) =>
                                        setStatusForm({
                                            ...statusForm,
                                            note: e.target.value,
                                        })
                                    }
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                    placeholder="Add a note about this status change..."
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
                                >
                                    {actionLoading
                                        ? "Updating..."
                                        : "Update Status"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowStatusModal(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Shipping Modal */}
            {showShippingModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-semibold mb-4">
                            Add Shipping Details
                        </h3>
                        <form
                            onSubmit={handleShippingSubmit}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Courier Name *
                                </label>
                                <input
                                    type="text"
                                    value={shippingForm.courier}
                                    onChange={(e) =>
                                        setShippingForm({
                                            ...shippingForm,
                                            courier: e.target.value,
                                        })
                                    }
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                    placeholder="e.g., BlueDart, DTDC, FedEx"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tracking Number *
                                </label>
                                <input
                                    type="text"
                                    value={shippingForm.trackingNumber}
                                    onChange={(e) =>
                                        setShippingForm({
                                            ...shippingForm,
                                            trackingNumber: e.target.value,
                                        })
                                    }
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                    placeholder="Enter tracking number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Estimated Delivery (Optional)
                                </label>
                                <input
                                    type="date"
                                    value={shippingForm.estimatedDelivery}
                                    onChange={(e) =>
                                        setShippingForm({
                                            ...shippingForm,
                                            estimatedDelivery: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-1 px-4 py-2 bg-info text-white rounded-lg hover:bg-info/90 disabled:opacity-50"
                                >
                                    {actionLoading
                                        ? "Adding..."
                                        : "Add Shipping"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowShippingModal(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-semibold mb-4 text-danger">
                            Cancel Order
                        </h3>
                        <form
                            onSubmit={handleCancelOrder}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cancellation Reason *
                                </label>
                                <textarea
                                    value={cancelForm.reason}
                                    onChange={(e) =>
                                        setCancelForm({
                                            ...cancelForm,
                                            reason: e.target.value,
                                        })
                                    }
                                    required
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-danger"
                                    placeholder="Enter reason for cancellation..."
                                />
                            </div>
                            <p className="text-sm text-gray-600">
                                This action will restore product stock and
                                cannot be undone.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-1 px-4 py-2 bg-danger text-white rounded-lg hover:bg-danger/90 disabled:opacity-50"
                                >
                                    {actionLoading
                                        ? "Cancelling..."
                                        : "Cancel Order"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCancelModal(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                >
                                    Close
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Mark Delivered Confirm Modal */}
            {showDeliveredModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-semibold mb-2">
                            Mark as Delivered
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to mark this order as
                            delivered? This action cannot be undone.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={async () => {
                                    setShowDeliveredModal(false);
                                    await handleMarkDelivered();
                                }}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 disabled:opacity-50"
                            >
                                {actionLoading
                                    ? "Updating..."
                                    : "Yes, Mark Delivered"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowDeliveredModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Note Modal */}
            {showNoteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-semibold mb-4">
                            Add Admin Note
                        </h3>
                        <form onSubmit={handleAddNote} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Note *
                                </label>
                                <textarea
                                    value={noteForm.note}
                                    onChange={(e) =>
                                        setNoteForm({
                                            ...noteForm,
                                            note: e.target.value,
                                        })
                                    }
                                    required
                                    rows="4"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                    placeholder="Add internal note about this order..."
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
                                >
                                    {actionLoading ? "Adding..." : "Add Note"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowNoteModal(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderDetail;
