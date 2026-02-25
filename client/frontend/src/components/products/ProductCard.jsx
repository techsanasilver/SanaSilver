import { useState } from "react";
import { Link } from "react-router-dom";
import { FiShoppingBag } from "react-icons/fi";
import { FaRegHeart, FaHeart } from "react-icons/fa";

import { getImageUrl } from "../../utils/image.util";
import { addToWishlist, removeFromWishlist } from "../../api/wishlist.api";
import logger from "../../utils/logger.util";

/**
 * ProductCard Component
 * Displays product with hover effects: image zoom, wishlist toggle, quick add button
 *
 * @param {Object} product - Product object with images, name, price, ratings
 * @param {boolean} showBadge - Whether to show badge (Best Seller, New, etc.)
 * @param {Function} onQuickAdd - Callback for quick add button click
 */
const ProductCard = ({ product, showBadge = false, onQuickAdd }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [isWishlistLoading, setIsWishlistLoading] = useState(false);

    // Get primary image or first image
    const primaryImage =
        product.images?.find((img) => img.isPrimary) || product.images?.[0];
    const imageUrl = getImageUrl(
        primaryImage,
        "medium",
        "https://placehold.co/400",
    );

    // Format price
    const formattedPrice = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(product.minPrice || 0);

    // Handle wishlist toggle
    const handleWishlistToggle = async (e) => {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation();

        setIsWishlistLoading(true);
        try {
            if (isInWishlist) {
                await removeFromWishlist(product._id);
                setIsInWishlist(false);
                logger.info("Removed from wishlist", {
                    productId: product._id,
                });
            } else {
                await addToWishlist(product._id);
                setIsInWishlist(true);
                logger.info("Added to wishlist", { productId: product._id });
            }
        } catch (error) {
            logger.error("Wishlist toggle error:", error);
            // TODO: Show toast notification when NotificationContext is implemented
            console.error("Failed to update wishlist");
        } finally {
            setIsWishlistLoading(false);
        }
    };

    // Handle quick add
    const handleQuickAdd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onQuickAdd) {
            onQuickAdd(product);
        }
    };

    // Determine badge text
    const getBadge = () => {
        if (!showBadge) return null;
        if (product.isFeatured) return "Featured";
        // Add more badge logic here (New, Sale, etc.)
        return null;
    };

    const badge = getBadge();

    return (
        <Link to={`/products/${product.slug}`} className="block">
            {/* Product Image Container */}
            <div
                className="relative aspect-15/16 border-none overflow-hidden rounded-sm group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Badge */}
                {badge && (
                    <div className="absolute top-4 left-4 z-10 bg-white px-3 py-1 text-xs font-medium text-text-primary rounded-sm">
                        {badge}
                    </div>
                )}

                {/* Wishlist Button */}
                <button
                    onClick={handleWishlistToggle}
                    disabled={isWishlistLoading}
                    className={`absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md  ${
                        isHovered
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 -translate-y-2"
                    } ${isWishlistLoading ? "cursor-wait" : "cursor-pointer"} hover:bg-accent-1 group/wishlist`}
                    aria-label={
                        isInWishlist
                            ? "Remove from wishlist"
                            : "Add to wishlist"
                    }
                >
                    {isInWishlist ? (
                        <FaHeart className="w-5 h-5 text-red-500" />
                    ) : (
                        <FaRegHeart className="w-5 h-5 text-text-primary group-hover/wishlist:text-white" />
                    )}
                </button>

                {/* Product Image with Zoom Effect */}
                <img
                    src={imageUrl}
                    alt={primaryImage?.alt || product.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    loading="lazy"
                />

                {/* Quick Add Button - Slides up from bottom */}
                <div
                    className={`absolute bottom-0 left-0 right-0 transition-transform duration-500 ${
                        isHovered ? "translate-y-0" : "translate-y-full"
                    }`}
                >
                    <button
                        onClick={handleQuickAdd}
                        className="w-full bg-background-secondary text-text-primary py-3 px-4 flex items-center justify-center gap-2 hover:bg-accent-1 hover:text-white transition-colors duration-200"
                    >
                        <span className="text-sm font-medium">QUICK ADD</span>
                        <FiShoppingBag className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Product Details */}
            <div
                className="p-4 text-center "
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Product Name */}
                <h3 className="text-text-primary text-sm mb-2 line-clamp-2">
                    {product.name}
                </h3>

                {/* Rating */}
                {product.ratings && product.ratings.count > 0 && (
                    <div className="flex items-center justify-center gap-2 mb-2">
                        {/* Star Rating */}
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, index) => {
                                const rating = product.ratings.average || 0;
                                const isHalfStar =
                                    rating > index && rating < index + 1;
                                const isFullStar = rating >= index + 1;

                                return (
                                    <svg
                                        key={index}
                                        className="w-4 h-4"
                                        fill={
                                            isFullStar || isHalfStar
                                                ? "currentColor"
                                                : "none"
                                        }
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        {isHalfStar ? (
                                            <defs>
                                                <linearGradient
                                                    id={`half-${product._id}-${index}`}
                                                >
                                                    <stop
                                                        offset="50%"
                                                        stopColor="currentColor"
                                                    />
                                                    <stop
                                                        offset="50%"
                                                        stopColor="transparent"
                                                    />
                                                </linearGradient>
                                            </defs>
                                        ) : null}
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            fill={
                                                isHalfStar
                                                    ? `url(#half-${product._id}-${index})`
                                                    : undefined
                                            }
                                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                        />
                                    </svg>
                                );
                            })}
                        </div>
                        {/* Review Count */}
                        <span className="text-sm text-text-muted">
                            ({product.ratings.count})
                        </span>
                    </div>
                )}

                {/* Price */}
                <div className="text-base font-semibold text-text-secondary">
                    {formattedPrice}
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;
