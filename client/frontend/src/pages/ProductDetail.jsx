/**
 * Product Detail Page
 * Single product view with images, variants, add to cart/wishlist
 */

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Loader from "../components/common/Loader";
import logger from "../utils/logger.util";

const ProductDetail = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        logger.info("Product detail page loaded", { productId: id });

        // Simulate loading
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, [id]);

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Product Images */}
                <div>
                    <div className="aspect-square bg-neutral-100 rounded-lg mb-4"></div>
                    <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map((img) => (
                            <div
                                key={img}
                                className="aspect-square bg-neutral-100 rounded"
                            ></div>
                        ))}
                    </div>
                </div>

                {/* Product Info */}
                <div>
                    <h1 className="text-3xl font-bold mb-2">Product Name</h1>
                    <p className="text-2xl font-bold text-primary mb-4">
                        ₹1,299
                    </p>

                    <div className="mb-6">
                        <p className="text-neutral-600 mb-4">
                            This is a placeholder description for the product.
                            Actual product details will be loaded from the
                            backend.
                        </p>
                    </div>

                    <div className="mb-6">
                        <h3 className="font-semibold mb-2">Select Variant</h3>
                        <div className="flex gap-2">
                            {["Small", "Medium", "Large"].map((size) => (
                                <button
                                    key={size}
                                    className="px-4 py-2 border border-neutral-300 rounded hover:border-primary"
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button className="flex-1 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark">
                            Add to Cart
                        </button>
                        <button className="p-3 border border-neutral-300 rounded-lg hover:border-primary">
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
