/**
 * Checkout Success Page
 * Order confirmation page shown after successful order placement
 */

import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import logger from "../utils/logger.util";

const CheckoutSuccess = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get("orderId");

    useEffect(() => {
        logger.info("Checkout success page loaded", { orderId });
    }, [orderId]);

    return (
        <div className="container mx-auto px-4 py-16">
            <div className="max-w-2xl mx-auto text-center">
                {/* Success Icon */}
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                        className="w-10 h-10 text-green-600"
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

                <h1 className="text-3xl font-bold text-neutral-800 mb-2">
                    Order Placed Successfully!
                </h1>
                <p className="text-neutral-600 mb-8">
                    Thank you for your order. We'll send you a confirmation
                    email shortly.
                </p>

                {orderId && (
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6 mb-8">
                        <p className="text-sm text-neutral-600 mb-1">
                            Order ID
                        </p>
                        <p className="text-lg font-mono font-semibold">
                            {orderId}
                        </p>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/orders"
                        className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark"
                    >
                        View Orders
                    </Link>
                    <Link
                        to="/shop"
                        className="px-6 py-3 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:border-primary hover:text-primary"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CheckoutSuccess;
