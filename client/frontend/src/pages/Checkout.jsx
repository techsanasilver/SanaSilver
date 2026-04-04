import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/common/Loader";
import AddressSelector from "../components/checkout/AddressSelector";
import PaymentMethodSelector from "../components/checkout/PaymentMethodSelector";
import {
    placeOrderCOD,
    createRazorpayOrder,
    verifyRazorpayPayment,
    cancelRazorpayOrder,
} from "../api/checkout.api";
import { updateProfile } from "../api/auth.api";
import logger from "../utils/logger.util";

const EMPTY_ADDRESS = {
    type: "home",
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
};

const validateAddress = (data) => {
    if (!data.name.trim()) return "Full name is required.";
    if (data.name.trim().length > 100)
        return "Name cannot exceed 100 characters.";
    if (!data.phone.trim()) return "Phone number is required.";
    if (!/^[6-9]\d{9}$|^\+91[6-9]\d{9}$/.test(data.phone.trim()))
        return "Enter a valid 10-digit Indian mobile number.";
    if (!data.addressLine1.trim()) return "Address line 1 is required.";
    if (!data.city.trim()) return "City is required.";
    if (!data.state.trim()) return "State is required.";
    if (!data.pincode.trim()) return "Pincode is required.";
    if (!/^\d{6}$/.test(data.pincode.trim()))
        return "Pincode must be exactly 6 digits.";
    return null;
};

const fieldCls =
    "px-3 py-2 text-sm border border-neutral-200 rounded-sm bg-white focus:outline-none focus:border-text-primary";

const CheckoutAddressForm = ({
    data,
    onChange,
    onSubmit,
    onCancel,
    saving,
    error,
}) => (
    <form
        onSubmit={onSubmit}
        noValidate
        className="mt-4 p-4 border border-neutral-200 rounded-sm space-y-3 bg-neutral-50"
    >
        <p className="text-sm font-medium text-text-primary">New address</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
                name="name"
                value={data.name}
                onChange={onChange}
                placeholder="Full name *"
                maxLength={100}
                className={fieldCls}
            />
            <input
                name="phone"
                value={data.phone}
                onChange={onChange}
                placeholder="Phone number * (10 digits)"
                inputMode="tel"
                maxLength={13}
                className={fieldCls}
            />
            <input
                name="addressLine1"
                value={data.addressLine1}
                onChange={onChange}
                placeholder="Address line 1 *"
                className={`sm:col-span-2 ${fieldCls}`}
            />
            <input
                name="addressLine2"
                value={data.addressLine2}
                onChange={onChange}
                placeholder="Address line 2"
                className={`sm:col-span-2 ${fieldCls}`}
            />
            <input
                name="city"
                value={data.city}
                onChange={onChange}
                placeholder="City *"
                className={fieldCls}
            />
            <input
                name="state"
                value={data.state}
                onChange={onChange}
                placeholder="State *"
                className={fieldCls}
            />
            <input
                name="pincode"
                value={data.pincode}
                onChange={onChange}
                placeholder="Pincode * (6 digits)"
                inputMode="numeric"
                maxLength={6}
                className={fieldCls}
            />
            <input
                name="landmark"
                value={data.landmark}
                onChange={onChange}
                placeholder="Landmark"
                className={fieldCls}
            />
            <div className="sm:col-span-2">
                <select
                    name="type"
                    value={data.type}
                    onChange={onChange}
                    className={`w-full sm:w-auto ${fieldCls}`}
                >
                    <option value="home">Home</option>
                    <option value="office">Office</option>
                    <option value="other">Other</option>
                </select>
            </div>
        </div>
        {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-sm px-3 py-2">
                {error}
            </p>
        )}
        <div className="flex gap-2 pt-1">
            <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm bg-text-primary text-white rounded-sm hover:bg-text-secondary transition-colors disabled:opacity-50"
            >
                {saving ? "Saving..." : "Save address"}
            </button>
            <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm border border-neutral-200 text-text-secondary rounded-sm hover:border-text-primary hover:text-text-primary transition-colors"
            >
                Cancel
            </button>
        </div>
    </form>
);

const Checkout = () => {
    const navigate = useNavigate();
    const {
        cart,
        isLoading: cartLoading,
        appliedCoupon,
        clearCart,
    } = useCart();
    const { user, isLoading: authLoading, updateUser } = useAuth();

    // Address & payment state
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [sameAsBilling, setSameAsBilling] = useState(true);
    const [billingAddressId, setBillingAddressId] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("cod");
    const [customerNote, setCustomerNote] = useState("");

    // Add address form state
    const [showAddForm, setShowAddForm] = useState(false);
    const [addFormData, setAddFormData] = useState(EMPTY_ADDRESS);
    const [addingAddress, setAddingAddress] = useState(false);
    const [addFormError, setAddFormError] = useState(null);

    // Billing add address form state
    const [showBillingAddForm, setShowBillingAddForm] = useState(false);
    const [billingAddFormData, setBillingAddFormData] = useState(EMPTY_ADDRESS);
    const [addingBillingAddress, setAddingBillingAddress] = useState(false);
    const [billingAddFormError, setBillingAddFormError] = useState(null);

    // Place order state
    const [isPlacing, setIsPlacing] = useState(false);
    const [placeError, setPlaceError] = useState(null);

    // Toggle this flag to enable/disable Razorpay at the frontend.
    // Keep in sync with RAZORPAY_ENABLED in client/backend/features/razorpay/payment.config.js
    const razorpayEnabled = false;

    // Pre-select default address when user loads
    useEffect(() => {
        if (user?.addresses?.length > 0 && !selectedAddressId) {
            const defaultAddr =
                user.addresses.find((a) => a.isDefault) || user.addresses[0];
            setSelectedAddressId(defaultAddr._id);
        }
    }, [user]);

    // Redirect if cart is empty (after loading is done)
    useEffect(() => {
        if (!cartLoading && !authLoading && !cart?.items?.length) {
            navigate("/cart");
        }
    }, [cart, cartLoading, authLoading, navigate]);

    useEffect(() => {
        logger.info("Checkout page loaded");
    }, []);

    if (authLoading || cartLoading) {
        return <Loader fullScreen />;
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    const getEffectiveBillingAddressId = () =>
        sameAsBilling ? selectedAddressId : billingAddressId;

    const formatPrice = (amount) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount ?? 0);

    const subtotal = cart?.totalPrice ?? 0;
    const couponDiscount = appliedCoupon?.discountAmount ?? 0;
    const estimatedTotal = Math.max(0, subtotal - couponDiscount);

    const addresses = user?.addresses || [];

    // -------------------------------------------------------------------------
    // Add Address
    // -------------------------------------------------------------------------

    const handleAddFormChange = (e) => {
        const { name, value } = e.target;
        setAddFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleBillingAddFormChange = (e) => {
        const { name, value } = e.target;
        setBillingAddFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        const validationError = validateAddress(addFormData);
        if (validationError) {
            setAddFormError(validationError);
            return;
        }
        setAddingAddress(true);
        setAddFormError(null);

        try {
            const response = await updateProfile({
                addresses: [...addresses, addFormData],
            });
            const updatedUser = response.data?.data?.user;
            updateUser(updatedUser);

            // Auto-select the newly added address
            const newAddress =
                updatedUser.addresses[updatedUser.addresses.length - 1];
            setSelectedAddressId(newAddress._id);
            setShowAddForm(false);
            setAddFormData(EMPTY_ADDRESS);
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                "Failed to add address. Please try again.";
            setAddFormError(msg);
        } finally {
            setAddingAddress(false);
        }
    };

    const handleAddBillingAddress = async (e) => {
        e.preventDefault();
        const validationError = validateAddress(billingAddFormData);
        if (validationError) {
            setBillingAddFormError(validationError);
            return;
        }
        setAddingBillingAddress(true);
        setBillingAddFormError(null);

        try {
            const response = await updateProfile({
                addresses: [...addresses, billingAddFormData],
            });
            const updatedUser = response.data?.data?.user;
            updateUser(updatedUser);

            const newAddress =
                updatedUser.addresses[updatedUser.addresses.length - 1];
            setBillingAddressId(newAddress._id);
            setShowBillingAddForm(false);
            setBillingAddFormData(EMPTY_ADDRESS);
        } catch (err) {
            setBillingAddFormError(
                err.response?.data?.message ||
                    "Failed to add address. Please try again.",
            );
        } finally {
            setAddingBillingAddress(false);
        }
    };

    // -------------------------------------------------------------------------
    // Place Order
    // -------------------------------------------------------------------------

    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            setPlaceError("Please select a delivery address.");
            return;
        }
        if (!sameAsBilling && !billingAddressId) {
            setPlaceError("Please select a billing address.");
            return;
        }

        setIsPlacing(true);
        setPlaceError(null);

        const billingId = getEffectiveBillingAddressId();
        const basePayload = {
            shippingAddressId: selectedAddressId,
            billingAddressId: billingId,
            customerNote: customerNote.trim() || undefined,
            couponCode: appliedCoupon?.code || undefined,
        };

        // ── COD flow ──────────────────────────────────────────────────────────
        if (paymentMethod === "cod") {
            try {
                const response = await placeOrderCOD({
                    ...basePayload,
                    paymentMethod: "cod",
                });
                const result = response.data?.data;
                logger.info("COD order placed", { orderId: result.orderId });
                navigate(
                    `/checkout/success?orderNumber=${encodeURIComponent(result.orderNumber)}`,
                );
                clearCart();
            } catch (err) {
                const msg =
                    err.response?.data?.message ||
                    "Failed to place order. Please try again.";
                setPlaceError(msg);
                logger.error("Place order error:", err.message);
                setIsPlacing(false);
            }
            return;
        }

        // ── Razorpay flow ─────────────────────────────────────────────────────
        if (paymentMethod === "razorpay") {
            if (!window.Razorpay) {
                setPlaceError(
                    "Razorpay could not be loaded. Please refresh and try again.",
                );
                setIsPlacing(false);
                return;
            }

            let orderDetails;
            try {
                const response = await createRazorpayOrder(basePayload);
                orderDetails = response.data?.data;
            } catch (err) {
                const msg =
                    err.response?.data?.message ||
                    "Failed to initiate payment. Please try again.";
                setPlaceError(msg);
                logger.error("Razorpay create order error:", err.message);
                setIsPlacing(false);
                return;
            }

            const options = {
                key: orderDetails.keyId,
                amount: orderDetails.amount,
                currency: orderDetails.currency,
                name: "Sana Silver",
                description: `Order #${orderDetails.orderNumber}`,
                order_id: orderDetails.razorpayOrderId,
                prefill: {
                    name: user?.name || "",
                    email: user?.email || "",
                    contact: user?.phone || "",
                },
                theme: { color: "#1a1a1a" },
                handler: async (rzpResponse) => {
                    try {
                        const verifyRes = await verifyRazorpayPayment({
                            razorpayOrderId: rzpResponse.razorpay_order_id,
                            razorpayPaymentId: rzpResponse.razorpay_payment_id,
                            razorpaySignature: rzpResponse.razorpay_signature,
                        });
                        const result = verifyRes.data?.data;
                        logger.info("Razorpay payment verified", {
                            orderId: result.orderId,
                        });
                        clearCart();
                        navigate(
                            `/checkout/success?orderNumber=${encodeURIComponent(result.orderNumber)}`,
                        );
                    } catch (err) {
                        const msg =
                            err.response?.data?.message ||
                            "Payment verification failed. Please contact support.";
                        setPlaceError(msg);
                        logger.error("Razorpay verify error:", err.message);
                        setIsPlacing(false);
                    }
                },
                modal: {
                    ondismiss: () => {
                        // Fire-and-forget — cancel the pending order and restore stock.
                        // Don't await; the user shouldn't wait on this.
                        cancelRazorpayOrder(orderDetails.razorpayOrderId).catch(
                            (err) =>
                                logger.error(
                                    "Failed to cancel pending order on dismiss:",
                                    err.message,
                                ),
                        );
                        setPlaceError(
                            "Payment was cancelled. You can try again.",
                        );
                        setIsPlacing(false);
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", (response) => {
                setPlaceError(
                    response.error?.description ||
                        "Payment failed. Please try a different method.",
                );
                logger.error("Razorpay payment failed:", response.error);
                setIsPlacing(false);
            });
            rzp.open();
        }
    };

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-background-primary">
            <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-display text-text-primary mb-8">
                    Checkout
                </h1>

                <div className="space-y-8">
                    {/* ── Delivery Address ── */}
                    <section>
                        <h2 className="text-lg font-medium text-text-primary mb-4">
                            Delivery Address
                        </h2>

                        {addresses.length > 0 && (
                            <AddressSelector
                                addresses={addresses}
                                selectedAddressId={selectedAddressId}
                                onAddressSelect={setSelectedAddressId}
                            />
                        )}

                        {/* Add new address */}
                        {!showAddForm ? (
                            <button
                                type="button"
                                onClick={() => setShowAddForm(true)}
                                className="mt-3 flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                            >
                                <span className="text-lg leading-none">+</span>
                                Add new address
                            </button>
                        ) : (
                            <CheckoutAddressForm
                                data={addFormData}
                                onChange={handleAddFormChange}
                                onSubmit={handleAddAddress}
                                onCancel={() => {
                                    setShowAddForm(false);
                                    setAddFormData(EMPTY_ADDRESS);
                                    setAddFormError(null);
                                }}
                                saving={addingAddress}
                                error={addFormError}
                            />
                        )}

                        {addresses.length === 0 && !showAddForm && (
                            <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-sm px-4 py-3">
                                Please add a delivery address to continue.
                            </p>
                        )}
                    </section>

                    {/* ── Billing Address ── */}
                    {addresses.length > 0 && (
                        <section>
                            <h2 className="text-lg font-medium text-text-primary mb-4">
                                Billing Address
                            </h2>

                            <button
                                type="button"
                                onClick={() => {
                                    setSameAsBilling((prev) => {
                                        if (!prev) {
                                            // switching back to "same as shipping" — close billing form
                                            setShowBillingAddForm(false);
                                            setBillingAddFormData(
                                                EMPTY_ADDRESS,
                                            );
                                            setBillingAddFormError(null);
                                        }
                                        return !prev;
                                    });
                                }}
                                className="flex items-center gap-2 mb-4 text-sm text-text-secondary hover:text-text-primary transition-colors"
                            >
                                <div
                                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                        sameAsBilling
                                            ? "bg-text-primary border-text-primary"
                                            : "border-neutral-400"
                                    }`}
                                >
                                    {sameAsBilling && (
                                        <svg
                                            className="w-2.5 h-2.5 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={3}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    )}
                                </div>
                                Same as delivery address
                            </button>

                            {!sameAsBilling && (
                                <>
                                    <AddressSelector
                                        addresses={addresses}
                                        selectedAddressId={billingAddressId}
                                        onAddressSelect={setBillingAddressId}
                                        label="Select billing address"
                                    />
                                    {!showBillingAddForm ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowBillingAddForm(true)
                                            }
                                            className="mt-3 flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                                        >
                                            <span className="text-lg leading-none">
                                                +
                                            </span>
                                            Add new address
                                        </button>
                                    ) : (
                                        <CheckoutAddressForm
                                            data={billingAddFormData}
                                            onChange={
                                                handleBillingAddFormChange
                                            }
                                            onSubmit={handleAddBillingAddress}
                                            onCancel={() => {
                                                setShowBillingAddForm(false);
                                                setBillingAddFormData(
                                                    EMPTY_ADDRESS,
                                                );
                                                setBillingAddFormError(null);
                                            }}
                                            saving={addingBillingAddress}
                                            error={billingAddFormError}
                                        />
                                    )}
                                </>
                            )}
                        </section>
                    )}

                    {/* ── Payment Method ── */}
                    <section>
                        <h2 className="text-lg font-medium text-text-primary mb-4">
                            Payment Method
                        </h2>
                        <PaymentMethodSelector
                            selectedMethod={paymentMethod}
                            onMethodSelect={setPaymentMethod}
                            razorpayEnabled={razorpayEnabled}
                        />
                    </section>

                    {/* ── Order Note ── */}
                    <section>
                        <h2 className="text-lg font-medium text-text-primary mb-3">
                            Order Note{" "}
                            <span className="text-sm font-normal text-text-secondary">
                                (optional)
                            </span>
                        </h2>
                        <textarea
                            value={customerNote}
                            onChange={(e) => setCustomerNote(e.target.value)}
                            placeholder="Any special instructions for your order..."
                            rows={3}
                            maxLength={500}
                            className="w-full px-4 py-3 text-sm border border-neutral-200 rounded-sm bg-white text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-text-primary transition-colors resize-none"
                        />
                    </section>

                    {/* ── Order Summary ── */}
                    <section className="border-t border-neutral-200 pt-6">
                        <h2 className="text-lg font-medium text-text-primary mb-4">
                            Order Summary
                        </h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-text-secondary">
                                    Subtotal
                                </span>
                                <span className="text-text-primary">
                                    {formatPrice(subtotal)}
                                </span>
                            </div>
                            {couponDiscount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">
                                        Coupon ({appliedCoupon.code})
                                    </span>
                                    <span className="text-green-600">
                                        − {formatPrice(couponDiscount)}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-text-secondary">
                                    Shipping
                                </span>
                                <span className="text-green-600">Free</span>
                            </div>
                            <div className="flex justify-between font-medium text-base pt-2 border-t border-neutral-200">
                                <span className="text-text-primary">
                                    Estimated Total
                                </span>
                                <span className="text-text-primary">
                                    {formatPrice(estimatedTotal)}
                                </span>
                            </div>
                        </div>
                        <p className="text-xs text-text-secondary mt-2">
                            Final total including taxes will be confirmed at
                            delivery.
                        </p>
                    </section>

                    {/* ── Error ── */}
                    {placeError && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-sm px-4 py-3">
                            {placeError}
                        </p>
                    )}

                    {/* ── Place Order ── */}
                    <button
                        type="button"
                        onClick={handlePlaceOrder}
                        disabled={
                            isPlacing ||
                            !selectedAddressId ||
                            (!sameAsBilling && !billingAddressId) ||
                            showAddForm ||
                            showBillingAddForm
                        }
                        className="w-full py-4 bg-text-primary text-white font-medium rounded-sm hover:bg-text-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPlacing
                            ? paymentMethod === "razorpay"
                                ? "Opening payment..."
                                : "Placing order..."
                            : `PLACE ORDER — ${formatPrice(estimatedTotal)}`}
                    </button>

                    <p className="text-xs text-text-secondary text-center">
                        {paymentMethod === "razorpay"
                            ? "By placing this order you agree to our terms of service. You will be redirected to Razorpay to complete payment."
                            : "By placing this order you agree to our terms of service. Payment is collected on delivery."}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
