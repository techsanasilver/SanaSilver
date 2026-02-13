/**
 * Checkout Page
 * Shipping address, payment method, order review
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/common/Loader";
import logger from "../utils/logger.util";

const Checkout = () => {
    const navigate = useNavigate();
    const { cart, loading: cartLoading } = useCart();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState("cod");

    useEffect(() => {
        // Redirect if cart is empty
        if (!cartLoading && (!cart || !cart.items || cart.items.length === 0)) {
            navigate("/cart");
        } else {
            setLoading(false);
        }

        logger.info("Checkout page loaded");
    }, [cart, cartLoading, navigate]);

    if (loading || cartLoading) {
        return <Loader />;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Checkout Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Shipping Address */}
                    <div className="p-6 border border-neutral-200 rounded-lg">
                        <h2 className="text-xl font-semibold mb-4">
                            Shipping Address
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Full Name"
                                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary"
                            />
                            <input
                                type="tel"
                                placeholder="Phone Number"
                                defaultValue={user?.phone || ""}
                                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary"
                            />
                            <input
                                type="text"
                                placeholder="Address Line 1"
                                className="md:col-span-2 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary"
                            />
                            <input
                                type="text"
                                placeholder="Address Line 2"
                                className="md:col-span-2 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary"
                            />
                            <input
                                type="text"
                                placeholder="City"
                                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary"
                            />
                            <input
                                type="text"
                                placeholder="State"
                                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary"
                            />
                            <input
                                type="text"
                                placeholder="Pin Code"
                                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="p-6 border border-neutral-200 rounded-lg">
                        <h2 className="text-xl font-semibold mb-4">
                            Payment Method
                        </h2>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-4 border border-neutral-300 rounded-lg cursor-pointer hover:border-primary">
                                <input
                                    type="radio"
                                    name="payment"
                                    value="cod"
                                    checked={paymentMethod === "cod"}
                                    onChange={(e) =>
                                        setPaymentMethod(e.target.value)
                                    }
                                    className="w-4 h-4"
                                />
                                <span className="font-medium">
                                    Cash on Delivery
                                </span>
                            </label>
                            <label className="flex items-center gap-3 p-4 border border-neutral-300 rounded-lg cursor-pointer hover:border-primary">
                                <input
                                    type="radio"
                                    name="payment"
                                    value="online"
                                    checked={paymentMethod === "online"}
                                    onChange={(e) =>
                                        setPaymentMethod(e.target.value)
                                    }
                                    className="w-4 h-4"
                                />
                                <span className="font-medium">
                                    Online Payment (Razorpay)
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="p-6 border border-neutral-200 rounded-lg sticky top-24">
                        <h2 className="text-xl font-bold mb-4">
                            Order Summary
                        </h2>

                        <div className="space-y-3 mb-4">
                            {cart?.items?.map((item) => (
                                <div
                                    key={item._id}
                                    className="flex justify-between text-sm"
                                >
                                    <span className="text-neutral-600">
                                        Product x{item.quantity}
                                    </span>
                                    <span>₹{item.price || 0}</span>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-neutral-200 pt-3 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span>₹{cart?.subtotal || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Shipping</span>
                                <span>₹{cart?.shippingCost || 0}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg pt-2 border-t border-neutral-200">
                                <span>Total</span>
                                <span>₹{cart?.total || 0}</span>
                            </div>
                        </div>

                        <button className="w-full mt-6 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark">
                            Place Order
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
