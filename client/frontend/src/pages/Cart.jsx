/**
 * Cart Page
 * Shopping cart with items, quantities, pricing
 */

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import Loader from "../components/common/Loader";
import logger from "../utils/logger.util";

const Cart = () => {
    const { cart, loading } = useCart();

    useEffect(() => {
        logger.info("Cart page loaded");
    }, []);

    if (loading) {
        return <Loader />;
    }

    const isEmpty = !cart || !cart.items || cart.items.length === 0;

    if (isEmpty) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <div className="max-w-md mx-auto">
                    <svg
                        className="w-24 h-24 mx-auto mb-4 text-neutral-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                    </svg>
                    <h2 className="text-2xl font-bold text-neutral-800 mb-2">
                        Your cart is empty
                    </h2>
                    <p className="text-neutral-600 mb-6">
                        Add some products to get started!
                    </p>
                    <Link
                        to="/shop"
                        className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2">
                    <div className="space-y-4">
                        {cart.items.map((item) => (
                            <div
                                key={item._id}
                                className="flex gap-4 p-4 border border-neutral-200 rounded-lg"
                            >
                                <div className="w-24 h-24 bg-neutral-100 rounded"></div>
                                <div className="flex-1">
                                    <h3 className="font-semibold">
                                        Product Name
                                    </h3>
                                    <p className="text-sm text-neutral-600 mt-1">
                                        Variant details
                                    </p>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center border border-neutral-300 rounded">
                                            <button className="px-3 py-1">
                                                -
                                            </button>
                                            <span className="px-3 py-1 border-x border-neutral-300">
                                                {item.quantity}
                                            </span>
                                            <button className="px-3 py-1">
                                                +
                                            </button>
                                        </div>
                                        <button className="text-sm text-red-600 hover:text-red-700">
                                            Remove
                                        </button>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg">
                                        ₹{item.price || 1000}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="p-6 border border-neutral-200 rounded-lg sticky top-24">
                        <h2 className="text-xl font-bold mb-4">
                            Order Summary
                        </h2>

                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span>₹{cart.subtotal || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Discount</span>
                                <span className="text-green-600">
                                    -₹{cart.discount || 0}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Shipping</span>
                                <span>₹{cart.shippingCost || 0}</span>
                            </div>
                            <div className="border-t border-neutral-200 pt-2 mt-2">
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>₹{cart.total || 0}</span>
                                </div>
                            </div>
                        </div>

                        <Link
                            to="/checkout"
                            className="block w-full px-6 py-3 bg-primary text-white text-center font-medium rounded-lg hover:bg-primary-dark"
                        >
                            Proceed to Checkout
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
