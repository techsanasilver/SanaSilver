import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FiHeart } from "react-icons/fi";
import { useWishlist } from "../context/WishlistContext";
import WishlistProductCard from "../components/products/WishlistProductCard";
import WishlistSkeleton from "../components/products/WishlistSkeleton";
import logger from "../utils/logger.util";

const Wishlist = () => {
    const { wishlist, isLoading, clearWishlist } = useWishlist();

    useEffect(() => {
        logger.info("Wishlist page loaded", { itemCount: wishlist.length });
    }, [wishlist]);

    const handleClearAll = async () => {
        await clearWishlist();
    };

    // Show skeleton loader while loading
    if (isLoading) {
        return <WishlistSkeleton />;
    }

    const isEmpty = !wishlist || wishlist.length === 0;

    if (isEmpty) {
        return (
            <div className="min-h-[calc(100vh-4rem)] bg-background-primary flex items-center justify-center px-4">
                <div className="max-w-md mx-auto text-center">
                    <FiHeart className="w-24 h-24 mx-auto mb-6 text-text-secondary/30 stroke-1" />
                    <h2 className="text-2xl lg:text-3xl font-light text-text-primary mb-3">
                        Your wishlist is empty
                    </h2>
                    <p className="text-text-secondary mb-8">
                        Save your favorite jewelry pieces for later!
                    </p>
                    <Link
                        to="/shop"
                        className="inline-block px-8 py-3 bg-text-primary text-white font-medium rounded-sm hover:bg-text-secondary transition-colors"
                    >
                        EXPLORE COLLECTION
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-background-primary">
            <div className="px-4 lg:px-8 xl:px-16 py-8 lg:py-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 lg:mb-12">
                    <div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl  font-display text-text-primary mb-2">
                            Wishlist
                        </h1>
                        <p className="text-sm lg:text-base text-text-secondary">
                            {wishlist.length}{" "}
                            {wishlist.length === 1 ? "item" : "items"} saved
                        </p>
                    </div>

                    {/* Clear All Button */}
                    {wishlist.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="text-base text-text-secondary hover:text-danger transition-colors underline"
                        >
                            Clear All
                        </button>
                    )}
                </div>

                {/* Wishlist Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                    {wishlist.map((item, index) => (
                        <WishlistProductCard
                            key={`${typeof item.productId === "object" ? item.productId._id : item.productId}-${typeof item.variantId === "object" ? item.variantId._id : item.variantId}`}
                            item={item}
                        />
                    ))}
                </div>

                {/* Continue Shopping Link */}
                <div className="text-center mt-12">
                    <Link
                        to="/shop"
                        className="inline-block px-8 py-3 bg-text-primary text-white font-medium rounded-sm hover:bg-text-secondary transition-colors"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Wishlist;
