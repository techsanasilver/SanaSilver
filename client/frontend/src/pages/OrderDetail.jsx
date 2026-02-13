/**
 * Order Detail Page
 * Detailed view of a single order with items, tracking, status
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Loader from "../components/common/Loader";
import logger from "../utils/logger.util";

const OrderDetail = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState(null);

    useEffect(() => {
        logger.info("Order detail page loaded", { orderId: id });

        // Simulate loading
        const timer = setTimeout(() => {
            setLoading(false);
            // Mock data
            setOrder({
                _id: id,
                orderNumber: "ORD-2024-001",
                createdAt: new Date().toISOString(),
                status: "processing",
                paymentMethod: "cod",
                total: 2499,
                subtotal: 2399,
                shippingCost: 100,
                discount: 0,
                items: [
                    {
                        _id: "1",
                        name: "Silver Necklace",
                        variant: "Medium",
                        quantity: 1,
                        price: 1299,
                    },
                    {
                        _id: "2",
                        name: "Silver Earrings",
                        variant: "Small",
                        quantity: 1,
                        price: 1100,
                    },
                ],
                shippingAddress: {
                    name: "John Doe",
                    phone: "9876543210",
                    address: "123, Sample Street, Sample Area",
                    city: "Mumbai",
                    state: "Maharashtra",
                    pinCode: "400001",
                },
            });
        }, 500);

        return () => clearTimeout(timer);
    }, [id]);

    if (loading) {
        return <Loader />;
    }

    if (!order) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold text-neutral-800 mb-2">
                    Order not found
                </h2>
                <Link to="/orders" className="text-primary hover:underline">
                    Go back to orders
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
                    <p className="text-neutral-600 mt-1">
                        Placed on{" "}
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                        })}
                    </p>
                </div>

                <span
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                        order.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "processing"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                    }`}
                >
                    {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Order Items & Shipping */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items */}
                    <div className="p-6 border border-neutral-200 rounded-lg">
                        <h2 className="text-xl font-semibold mb-4">
                            Order Items
                        </h2>
                        <div className="space-y-4">
                            {order.items.map((item) => (
                                <div
                                    key={item._id}
                                    className="flex gap-4 pb-4 border-b last:border-0"
                                >
                                    <div className="w-20 h-20 bg-neutral-100 rounded"></div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold">
                                            {item.name}
                                        </h3>
                                        <p className="text-sm text-neutral-600 mt-1">
                                            Variant: {item.variant}
                                        </p>
                                        <p className="text-sm text-neutral-600">
                                            Quantity: {item.quantity}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">
                                            ₹{item.price}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="p-6 border border-neutral-200 rounded-lg">
                        <h2 className="text-xl font-semibold mb-4">
                            Shipping Address
                        </h2>
                        <div className="text-neutral-700 space-y-1">
                            <p className="font-medium">
                                {order.shippingAddress.name}
                            </p>
                            <p>{order.shippingAddress.phone}</p>
                            <p>{order.shippingAddress.address}</p>
                            <p>
                                {order.shippingAddress.city},{" "}
                                {order.shippingAddress.state} -{" "}
                                {order.shippingAddress.pinCode}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="p-6 border border-neutral-200 rounded-lg sticky top-24">
                        <h2 className="text-xl font-semibold mb-4">
                            Order Summary
                        </h2>

                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span>₹{order.subtotal}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Shipping</span>
                                <span>₹{order.shippingCost}</span>
                            </div>
                            {order.discount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Discount</span>
                                    <span>-₹{order.discount}</span>
                                </div>
                            )}
                            <div className="border-t border-neutral-200 pt-2 mt-2">
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>₹{order.total}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-neutral-200">
                            <p className="text-sm text-neutral-600 mb-1">
                                Payment Method
                            </p>
                            <p className="font-medium">
                                {order.paymentMethod === "cod"
                                    ? "Cash on Delivery"
                                    : "Online Payment"}
                            </p>
                        </div>

                        <button className="w-full mt-6 px-6 py-3 border border-neutral-300 font-medium rounded-lg hover:border-primary hover:text-primary">
                            Track Order
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
