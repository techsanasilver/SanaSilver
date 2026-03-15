import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { FiShoppingBag } from "react-icons/fi";
import { FaRegHeart, FaHeart } from "react-icons/fa";

import { getImageUrl } from "../../utils/image.util";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import logger from "../../utils/logger.util";

const ProductCard = ({ product, showBadge = false, onQuickAdd }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const {
        isInWishlist,
        toggleWishlist,
        isLoading: isWishlistLoading,
    } = useWishlist();
    const { addToCart, isInCart } = useCart();

    // Get the first available (in-stock) variant or first variant
    const firstVariant = useMemo(() => {
        if (!product.variants || product.variants.length === 0) {
            return null;
        }
        const inStockVariant = product.variants.find(
            (v) => v.stockQuantity > 0 && v.isActive,
        );
        return inStockVariant || product.variants[0];
    }, [product.variants]);

    // Check if this product+variant is wishlisted
    const isWishlisted = useMemo(() => {
        return firstVariant
            ? isInWishlist(product._id, firstVariant._id)
            : false;
    }, [firstVariant, product._id, isInWishlist]);

    // Check if this product+variant is in cart
    const itemInCart = useMemo(() => {
        return firstVariant ? isInCart(product._id, firstVariant._id) : false;
    }, [firstVariant, product._id, isInCart]);

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

        if (!firstVariant) {
            logger.warn("No variant available for wishlist", {
                productId: product._id,
            });
            return;
        }

        try {
            await toggleWishlist(product._id, firstVariant._id);
            logger.info("Wishlist toggled", {
                productId: product._id,
                variantId: firstVariant._id,
            });
        } catch (error) {
            logger.error("Wishlist toggle error:", error);
            // TODO: Show toast notification when NotificationContext is implemented
            console.error("Failed to update wishlist");
        }
    };

    // Handle quick add to cart
    const handleQuickAdd = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!firstVariant || firstVariant.stockQuantity === 0) {
            logger.warn("No stock available", {
                productId: product._id,
                variantId: firstVariant?._id,
            });
            return;
        }

        // If onQuickAdd callback exists (custom behavior), use it
        if (onQuickAdd) {
            onQuickAdd(product);
            return;
        }

        // Otherwise, add to cart directly
        setIsAddingToCart(true);
        try {
            const success = await addToCart(product._id, firstVariant._id, 1);

            if (success) {
                logger.info("Added to cart from ProductCard", {
                    productId: product._id,
                    variantId: firstVariant._id,
                });
                // TODO: Show success notification when NotificationContext is implemented
            }
        } catch (error) {
            logger.error("Failed to add to cart:", error);
            // TODO: Show error notification
        } finally {
            setIsAddingToCart(false);
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

    // MRP for strikethrough display (variant level)
    const formattedMrp =
        firstVariant?.mrp && firstVariant.mrp > firstVariant.sellingPrice
            ? new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
              }).format(firstVariant.mrp)
            : null;

    return (
        <>
            {/* ── MOBILE / TABLET CARD (< lg) ── */}
            <Link to={`/products/${product.slug}`} className="block lg:hidden">
                {/* Image */}
                <div className="relative aspect-15/16 overflow-hidden rounded-sm">
                    {/* Badge */}
                    {badge && (
                        <div className="absolute top-3 left-3 z-10 bg-white px-2 py-0.5 text-xs font-medium text-text-primary rounded-sm">
                            {badge}
                        </div>
                    )}

                    <img
                        src={imageUrl}
                        alt={primaryImage?.alt || product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                </div>

                {/* Info */}
                <div className="pt-1 mb-6">
                    {/* Price row */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text-primary/70">
                            {formattedPrice}
                        </span>
                        {formattedMrp && (
                            <span className="text-xs text-text-primary/70 line-through">
                                {formattedMrp}
                            </span>
                        )}
                        {/* Compact rating */}
                        {product.ratings && product.ratings.count > 0 && (
                            <div className="flex items-center gap-1 ml-auto">
                                <svg
                                    className="w-3 h-3 text-yellow-400 fill-current shrink-0"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                                <span className="text-xs text-text-muted">
                                    {product.ratings.average?.toFixed(1)}{" "}
                                    <span className="text-text-muted/70">
                                        {product.ratings.count}
                                    </span>
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Product Name */}
                    <h3 className="text-text-primary text-sm font-medium font-display leading-snug line-clamp-2 mb-2">
                        {product.name}
                    </h3>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleQuickAdd}
                            disabled={
                                !firstVariant ||
                                firstVariant.stockQuantity === 0 ||
                                isAddingToCart
                            }
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-background-secondary text-text-primary text-xs border border-background-secondary rounded-xs transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FiShoppingBag className="w-4 h-4 shrink-0" />
                            <span>
                                {isAddingToCart
                                    ? "Adding..."
                                    : !firstVariant ||
                                        firstVariant.stockQuantity === 0
                                      ? "Out of Stock"
                                      : itemInCart
                                        ? "Add More"
                                        : "Add to Cart"}
                            </span>
                        </button>

                        <button
                            onClick={handleWishlistToggle}
                            disabled={isWishlistLoading || !firstVariant}
                            className="w-9 h-9 shrink-0 flex items-center justify-center border border-background-secondary rounded-xs group/wl transition-colors duration-200 disabled:opacity-50"
                            aria-label={
                                isWishlisted
                                    ? "Remove from wishlist"
                                    : "Add to wishlist"
                            }
                        >
                            {isWishlisted ? (
                                <FaHeart className="w-4 h-4 text-accent-1 group-hover/wl:text-white transition-colors duration-200" />
                            ) : (
                                <FaRegHeart className="w-4 h-4 text-text-primary group-hover/wl:text-white transition-colors duration-200" />
                            )}
                        </button>
                    </div>
                </div>
            </Link>

            {/* ── DESKTOP CARD (lg+) ── */}
            <Link to={`/products/${product.slug}`} className="hidden lg:block">
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
                        disabled={isWishlistLoading || !firstVariant}
                        className={`absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 ${
                            isHovered
                                ? "opacity-100 translate-y-0"
                                : "opacity-0 -translate-y-2"
                        } ${isWishlistLoading ? "cursor-wait" : "cursor-pointer"} hover:bg-accent-1 group/wishlist`}
                        aria-label={
                            isWishlisted
                                ? "Remove from wishlist"
                                : "Add to wishlist"
                        }
                    >
                        {isWishlisted ? (
                            <FaHeart className="w-5 h-5 text-accent-1 group-hover/wishlist:text-white transition-colors duration-200" />
                        ) : (
                            <FaRegHeart className="w-5 h-5 text-text-primary group-hover/wishlist:text-white transition-colors duration-200" />
                        )}
                    </button>

                    {/* Product Image with Zoom Effect */}
                    <img
                        src={imageUrl}
                        alt={primaryImage?.alt || product.name}
                        className="w-full h-full object-cover transition-transform duration-800 ease-out group-hover:scale-110"
                        loading="lazy"
                    />

                    {/* Quick Add Button - Slides up from bottom */}
                    <div
                        className={`absolute bottom-0 left-0 right-0 transition-transform duration-800 ${
                            isHovered ? "translate-y-0" : "translate-y-full"
                        }`}
                    >
                        <button
                            onClick={handleQuickAdd}
                            disabled={
                                !firstVariant ||
                                firstVariant.stockQuantity === 0 ||
                                isAddingToCart
                            }
                            className="w-full bg-background-secondary text-text-primary py-3 px-4 flex items-center justify-center gap-2 hover:bg-accent-1 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="text-sm font-medium">
                                {isAddingToCart
                                    ? "ADDING..."
                                    : !firstVariant ||
                                        firstVariant.stockQuantity === 0
                                      ? "OUT OF STOCK"
                                      : itemInCart
                                        ? "ADD MORE"
                                        : "ADD TO CART"}
                            </span>
                            <FiShoppingBag className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Product Details */}
                <div
                    className="p-4 text-center"
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
                            <span className="text-sm text-text-muted">
                                ({product.ratings.count})
                            </span>
                        </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-base font-semibold text-text-secondary">
                            {formattedPrice}
                        </span>
                        {formattedMrp && (
                            <span className="text-sm text-text-muted line-through">
                                {formattedMrp}
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </>
    );
};

export default ProductCard;
