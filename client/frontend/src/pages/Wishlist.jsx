/**
 * Wishlist Page
 * User's saved products
 */

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import Loader from "../components/common/Loader";
import logger from "../utils/logger.util";

const Wishlist = () => {
    const { wishlist, loading } = useWishlist();

    useEffect(() => {
        logger.info("Wishlist page loaded");
    }, []);

    if (loading) {
        return <Loader />;
    }

    const isEmpty = !wishlist || wishlist.length === 0;

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
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                    </svg>
                    <h2 className="text-2xl font-bold text-neutral-800 mb-2">
                        Your wishlist is empty
                    </h2>
                    <p className="text-neutral-600 mb-6">
                        Save your favorite products for later!
                    </p>
                    <Link
                        to="/shop"
                        className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark"
                    >
                        Explore Products
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">My Wishlist</h1>
                <p className="text-neutral-600">{wishlist.length} items</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {wishlist.map((item) => (
                    <div
                        key={item._id}
                        className="border border-neutral-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                    >
                        <div className="relative group">
                            <Link to={`/products/${item._id}`}>
                                <div className="aspect-square bg-neutral-100"></div>
                            </Link>

                            {/* Remove from Wishlist */}
                            <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 hover:text-red-600">
                                <svg
                                    className="w-5 h-5"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        d="M6 18L18 6M6 6l12 12"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    />
                                </svg>
                            </button>
                        </div>

                        <div className="p-4">
                            <Link to={`/products/${item._id}`}>
                                <h3 className="font-medium mb-1 hover:text-primary">
                                    Product Name
                                </h3>
                                <p className="text-sm text-neutral-600 mb-2">
                                    Description
                                </p>
                                <p className="text-lg font-bold text-primary">
                                    ₹{item.price || 1299}
                                </p>
                            </Link>

                            <button className="w-full mt-3 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark">
                                Add to Cart
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Wishlist;
