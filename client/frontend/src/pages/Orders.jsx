/**
 * Orders Page
 * List of all user orders with status
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Loader from "../components/common/Loader";
import logger from "../utils/logger.util";

const Orders = () => {
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        logger.info("Orders page loaded");

        // Simulate loading
        const timer = setTimeout(() => {
            setLoading(false);
            // Mock data
            setOrders([
                {
                    _id: "1",
                    orderNumber: "ORD-2024-001",
                    createdAt: new Date().toISOString(),
                    status: "processing",
                    total: 2499,
                    itemsCount: 2,
                },
                {
                    _id: "2",
                    orderNumber: "ORD-2024-002",
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                    status: "delivered",
                    total: 1299,
                    itemsCount: 1,
                },
            ]);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return <Loader />;
    }

    if (orders.length === 0) {
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
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                    </svg>
                    <h2 className="text-2xl font-bold text-neutral-800 mb-2">
                        No orders yet
                    </h2>
                    <p className="text-neutral-600 mb-6">
                        Start shopping to see your orders here!
                    </p>
                    <Link
                        to="/shop"
                        className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark"
                    >
                        Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">My Orders</h1>

            <div className="space-y-4">
                {orders.map((order) => (
                    <Link
                        key={order._id}
                        to={`/orders/${order._id}`}
                        className="block p-6 border border-neutral-200 rounded-lg hover:shadow-lg transition-shadow"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <p className="font-semibold text-lg mb-1">
                                    {order.orderNumber}
                                </p>
                                <p className="text-sm text-neutral-600">
                                    {new Date(
                                        order.createdAt,
                                    ).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </p>
                                <p className="text-sm text-neutral-600 mt-1">
                                    {order.itemsCount}{" "}
                                    {order.itemsCount === 1 ? "item" : "items"}
                                </p>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-sm text-neutral-600">
                                        Total
                                    </p>
                                    <p className="text-lg font-bold">
                                        ₹{order.total}
                                    </p>
                                </div>

                                <div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-medium ${
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
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Orders;
