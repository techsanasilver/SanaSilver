import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiShoppingBag, FiX } from "react-icons/fi";
import { getImageUrl } from "../../utils/image.util";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import logger from "../../utils/logger.util";

/**
 * WishlistProductCard Component
 * Displays wishlisted product with variant info, move to cart, and remove buttons
 *
 * @param {Object} item - Wishlist item with productId, variantId, product, variant
 */
const WishlistProductCard = ({ item }) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const {
        removeFromWishlist,
        refetchWishlist,
        isLoading: isWishlistLoading,
    } = useWishlist();
    const { addToCart } = useCart();
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    // Extract product and variant data
    // For authenticated users: productId and variantId are populated objects
    // For guest users: they are stored as strings with product/variant data
    const product =
        typeof item.productId === "object" ? item.productId : item.product;
    const variant =
        typeof item.variantId === "object" ? item.variantId : item.variant;

    const productId =
        typeof item.productId === "object"
            ? item.productId._id
            : item.productId;
    const variantId =
        typeof item.variantId === "object"
            ? item.variantId._id
            : item.variantId;

    // Get variant image or product primary image
    const primaryImage =
        variant?.images?.find((img) => img.isPrimary) ||
        variant?.images?.[0] ||
        product?.images?.find((img) => img.isPrimary) ||
        product?.images?.[0];

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
    }).format(variant?.sellingPrice || product?.minPrice || 0);

    // Handle remove from wishlist
    const handleRemove = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            await removeFromWishlist(productId, variantId);
            await refetchWishlist();
            logger.info("Removed from wishlist", { productId, variantId });
        } catch (error) {
            logger.error("Failed to remove from wishlist:", error);
        }
    };

    // Handle move to cart
    const handleMoveToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!variant || variant.stockQuantity === 0) {
            logger.warn("Variant out of stock");
            return;
        }

        try {
            setIsAddingToCart(true);

            // Add to cart with correct signature: (productId, variantId, quantity)
            const success = await addToCart(productId, variantId, 1);

            if (success) {
                // Remove from wishlist after successfully adding to cart
                await removeFromWishlist(productId, variantId);
                await refetchWishlist();

                logger.info("Moved to cart", { productId, variantId });
            }
        } catch (error) {
            logger.error("Failed to move to cart:", error);
        } finally {
            setIsAddingToCart(false);
        }
    };

    // Navigate to product detail with variant selected
    const handleCardClick = (e) => {
        e.preventDefault();
        navigate(`/products/${product.slug}?variantId=${variantId}`);
    };

    if (!product || !variant) {
        return null;
    }

    return (
        <div onClick={handleCardClick} className="block cursor-pointer">
            {/* Product Image Container */}
            <div
                className="relative aspect-15/16 border-none overflow-hidden rounded-sm group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Remove Button */}
                <button
                    onClick={handleRemove}
                    disabled={isWishlistLoading}
                    className={`absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 ${
                        isHovered
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 -translate-y-2"
                    } ${isWishlistLoading ? "cursor-wait" : "cursor-pointer"} hover:bg-danger group/remove`}
                    aria-label="Remove from wishlist"
                >
                    <FiX className="w-5 h-5 text-text-primary group-hover/remove:text-white" />
                </button>

                {/* Out of Stock Badge */}
                {variant.stockQuantity === 0 && (
                    <div className="absolute top-4 left-4 z-10 bg-danger text-white px-3 py-1 text-xs font-medium rounded-sm">
                        Out of Stock
                    </div>
                )}

                {/* Product Image with Zoom Effect */}
                <img
                    src={imageUrl}
                    alt={primaryImage?.alt || product.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    loading="lazy"
                />

                {/* Move to Cart Button - Slides up from bottom */}
                <div
                    className={`absolute bottom-0 left-0 right-0 transition-transform duration-500 ${
                        isHovered ? "translate-y-0" : "translate-y-full"
                    }`}
                >
                    <button
                        onClick={handleMoveToCart}
                        disabled={variant.stockQuantity === 0 || isAddingToCart}
                        className="w-full bg-background-secondary text-text-primary py-3 px-4 flex items-center justify-center gap-2 hover:bg-accent-1 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="text-sm font-medium">
                            {isAddingToCart
                                ? "MOVING..."
                                : variant.stockQuantity === 0
                                  ? "OUT OF STOCK"
                                  : "MOVE TO CART"}
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

                {/* Variant Attributes */}
                {variant.attributes && variant.attributes.length > 0 && (
                    <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
                        {variant.attributes.map((attr, index) => (
                            <span
                                key={index}
                                className="text-xs text-text-secondary bg-background-secondary px-2 py-1 rounded-sm"
                            >
                                {attr.key}: {attr.value}
                            </span>
                        ))}
                    </div>
                )}

                {/* Price */}
                <div className="text-base font-semibold text-text-secondary">
                    {formattedPrice}
                </div>

                {/* Stock Status */}
                {variant.stockQuantity > 0 && variant.stockQuantity <= 5 && (
                    <p className="text-xs text-amber-600 mt-1">
                        Only {variant.stockQuantity} left
                    </p>
                )}
            </div>
        </div>
    );
};

export default WishlistProductCard;
