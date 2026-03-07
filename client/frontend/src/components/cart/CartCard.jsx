import { useState } from "react";
import { Link } from "react-router-dom";
import { FiX, FiMinus, FiPlus, FiHeart } from "react-icons/fi";
import { getImageUrl } from "../../utils/image.util";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";
import logger from "../../utils/logger.util";

/**
 * CartCard Component
 * Displays cart item with quantity controls, price, and actions
 *
 * @param {Object} item - Cart item with productId, variantId, quantity
 * @param {function} onQuantityAdjusted - Callback when backend adjusts quantity
 */
const CartCard = ({ item, onQuantityAdjusted }) => {
    const { updateCartItem, removeFromCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { isAuthenticated } = useAuth();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [isMovingToWishlist, setIsMovingToWishlist] = useState(false);
    const [localQuantity, setLocalQuantity] = useState(item.quantity);

    // Extract product and variant data
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

    // Calculate prices
    const unitPrice = variant?.sellingPrice || 0;
    const itemTotal = unitPrice * localQuantity;

    // Format price
    const formatPrice = (price) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(price);

    // Handle quantity change
    const handleQuantityChange = async (newQuantity) => {
        if (newQuantity === localQuantity || newQuantity < 1) return;

        setIsUpdating(true);
        setLocalQuantity(newQuantity);

        try {
            const result = await updateCartItem(
                productId,
                variantId,
                newQuantity,
            );

            if (result.success) {
                if (result.adjusted && onQuantityAdjusted) {
                    // Backend adjusted the quantity
                    onQuantityAdjusted({
                        productName: product.name,
                        requested: newQuantity,
                        actual: result.actualQuantity,
                    });
                    setLocalQuantity(result.actualQuantity);
                }
                logger.info("Cart item quantity updated", {
                    productId,
                    variantId,
                    quantity: result.actualQuantity || newQuantity,
                });
            } else {
                // Validation failed, revert local state
                setLocalQuantity(item.quantity);
                if (result.error && onQuantityAdjusted) {
                    onQuantityAdjusted({
                        error: result.error,
                        productName: product.name,
                    });
                }
            }
        } catch (error) {
            logger.error("Failed to update quantity:", error);
            setLocalQuantity(item.quantity);
        } finally {
            setIsUpdating(false);
        }
    };

    // Handle remove from cart
    const handleRemove = async () => {
        setIsRemoving(true);
        try {
            await removeFromCart(productId, variantId);
            logger.info("Removed from cart", { productId, variantId });
        } catch (error) {
            logger.error("Failed to remove from cart:", error);
        } finally {
            setIsRemoving(false);
        }
    };

    // Handle move to wishlist
    const handleMoveToWishlist = async () => {
        if (!isAuthenticated) {
            logger.warn("Move to wishlist attempted by guest user");
            return;
        }

        setIsMovingToWishlist(true);
        try {
            // Check if already in wishlist
            const alreadyInWishlist = isInWishlist(productId, variantId);

            if (alreadyInWishlist) {
                // Just remove from cart
                await removeFromCart(productId, variantId);
                logger.info("Removed from cart (already in wishlist)", {
                    productId,
                    variantId,
                });
            } else {
                // Add to wishlist first
                const success = await toggleWishlist(productId, variantId);

                if (success) {
                    // Then remove from cart
                    await removeFromCart(productId, variantId);
                    logger.info("Moved to wishlist and removed from cart", {
                        productId,
                        variantId,
                    });
                } else {
                    logger.error("Failed to add to wishlist");
                }
            }
        } catch (error) {
            logger.error("Failed to move to wishlist:", error);
        } finally {
            setIsMovingToWishlist(false);
        }
    };

    if (!product || !variant) {
        return null;
    }

    return (
        <div
            className={`relative flex flex-col lg:flex-row gap-4 p-4 lg:p-6 rounded-xs bg-[#f2efec] transition-opacity ${
                isRemoving ? "opacity-50" : "opacity-100"
            }`}
        >
            {/* Remove Button - Top Right (Desktop & Mobile) */}
            <button
                onClick={handleRemove}
                disabled={isRemoving}
                className="absolute top-3 right-3 lg:top-4 lg:right-4 p-1.5 text-text-secondary hover:text-danger transition-colors disabled:opacity-50 z-10"
                aria-label="Remove from cart"
                title="Remove from cart"
            >
                <FiX className="w-5 h-5" />
            </button>

            {/* Mobile/Desktop: Image and Product Info Row */}
            <div className="flex gap-4 flex-1">
                {/* Product Image */}
                <Link
                    to={`/products/${product.slug}?variantId=${variantId}`}
                    className="shrink-0"
                >
                    <img
                        src={imageUrl}
                        alt={primaryImage?.alt || product.name}
                        className="w-20 h-24 lg:w-28 lg:h-32 object-cover rounded-sm hover:opacity-80 transition-opacity"
                        loading="lazy"
                    />
                </Link>

                {/* Product Details */}
                <div className="flex-1 flex flex-col pr-6 lg:pr-0">
                    {/* Top Section: Name, Variant */}
                    <div className="mb-5">
                        <Link
                            to={`/products/${product.slug}?variantId=${variantId}`}
                        >
                            <h3 className="text-base lg:text-xl font-semibold font-display text-text-primary mb-1 pr-4 lg:pr-0">
                                {product.name}
                            </h3>
                        </Link>

                        {/* Variant Attributes */}
                        {variant.attributes &&
                            variant.attributes.length > 0 && (
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    {variant.attributes.map((attr, index) => (
                                        <span
                                            key={index}
                                            className="text-sm text-text-primary/70"
                                        >
                                            {attr.key}: {attr.value}
                                        </span>
                                    ))}
                                </div>
                            )}
                    </div>

                    {/* Bottom Section: Quantity Controls & Price */}
                    <div className="flex justify-between items-end gap-4 mt-auto">
                        {/* Left: Quantity Controls & Wishlist */}
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-3 flex-wrap">
                                {/* Quantity Controls */}
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center">
                                        <button
                                            onClick={() =>
                                                handleQuantityChange(
                                                    localQuantity - 1,
                                                )
                                            }
                                            disabled={
                                                localQuantity <= 1 || isUpdating
                                            }
                                            className="w-8 h-8 flex items-center justify-center border border-divider rounded-sm hover:bg-background-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label="Decrease quantity"
                                        >
                                            <FiMinus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="w-10 h-8 flex items-center justify-center font-semibold text-base text-text-primary/70">
                                            {localQuantity}
                                        </span>
                                        <button
                                            onClick={() =>
                                                handleQuantityChange(
                                                    localQuantity + 1,
                                                )
                                            }
                                            disabled={
                                                isUpdating ||
                                                (variant.stockQuantity &&
                                                    localQuantity >=
                                                        variant.stockQuantity)
                                            }
                                            className="w-8 h-8 flex items-center justify-center border border-divider rounded-sm hover:bg-background-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label="Increase quantity"
                                        >
                                            <FiPlus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Stock Info */}
                                {variant.stockQuantity &&
                                    variant.stockQuantity <= 10 && (
                                        <p className="text-xs text-amber-600">
                                            {variant.stockQuantity <= 5
                                                ? `Only ${variant.stockQuantity} left`
                                                : `${variant.stockQuantity} in stock`}
                                        </p>
                                    )}
                            </div>

                            {/* Move to Wishlist */}
                            <button
                                onClick={handleMoveToWishlist}
                                disabled={
                                    !isAuthenticated ||
                                    isRemoving ||
                                    isMovingToWishlist
                                }
                                className="flex items-center gap-2 text-xs text-text-secondary hover:text-accent-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-fit"
                                aria-label="Move to wishlist"
                                title={
                                    !isAuthenticated
                                        ? "Login to use wishlist"
                                        : "Move to wishlist"
                                }
                            >
                                <FiHeart className="w-4 h-4" />
                                <span>
                                    {isMovingToWishlist
                                        ? "MOVING..."
                                        : "MOVE TO WISHLIST"}
                                </span>
                            </button>
                        </div>

                        {/* Right: Price (Desktop) */}
                        <div className="hidden lg:block text-right">
                            <p className="text-lg font-semibold text-text-primary/70">
                                {formatPrice(itemTotal)}
                            </p>
                            <p className="text-sm text-text-secondary">
                                {formatPrice(unitPrice)} each
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subtotal (Mobile) - Below Image and Info */}
            <div className="lg:hidden pt-4 border-t border-divider">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">
                        Subtotal:
                    </span>
                    <p className="text-lg font-semibold text-text-primary/70">
                        {formatPrice(itemTotal)}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CartCard;
