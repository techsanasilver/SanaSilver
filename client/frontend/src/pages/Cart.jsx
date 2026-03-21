import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiShoppingBag } from "react-icons/fi";
import { useCart } from "../context/CartContext";
import CartCard from "../components/cart/CartCard";
import CartSkeleton from "../components/cart/CartSkeleton";
import CouponSection from "../components/cart/CouponSection";
import logger from "../utils/logger.util";

const Cart = () => {
    const { cart, isLoading, getCartCount, getCartTotal, appliedCoupon } =
        useCart();
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        logger.info("Cart page loaded", { itemCount: cart.items.length });
    }, [cart.items.length]);

    // Handle quantity adjustment notifications
    const handleQuantityAdjusted = (info) => {
        if (info.error) {
            // Validation error
            setNotification({
                type: "error",
                message: info.error,
            });
        } else if (info.actual !== info.requested) {
            // Backend adjusted quantity
            setNotification({
                type: "warning",
                message: `Quantity for "${info.productName}" adjusted to ${info.actual} (limited stock)`,
            });
        }

        // Auto-hide notification after 5 seconds
        setTimeout(() => setNotification(null), 5000);
    };

    // Format price
    const formatPrice = (price) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(price);

    // Show skeleton while loading
    if (isLoading) {
        return <CartSkeleton />;
    }

    const isEmpty = !cart || !cart.items || cart.items.length === 0;

    // Empty cart state
    if (isEmpty) {
        return (
            <div className="min-h-[calc(100vh-4rem)] bg-background-primary flex items-center justify-center px-4">
                <div className="max-w-md mx-auto text-center">
                    <FiShoppingBag className="w-24 h-24 mx-auto mb-6 text-text-secondary/30 stroke-1" />
                    <h2 className="text-2xl lg:text-3xl font-light text-text-primary mb-3">
                        Your cart is empty
                    </h2>
                    <p className="text-text-secondary mb-8">
                        Discover our exquisite collection of silver jewelry
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

    const totalItems = getCartCount();
    const subtotal = getCartTotal();
    const discount = appliedCoupon?.discountAmount || 0;
    const estimatedTotal = Math.max(0, subtotal - discount);

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-background-primary">
            <div className="px-4 lg:px-8 xl:px-16 py-8 lg:py-12">
                {/* Notification */}
                {notification && (
                    <div
                        className={`mb-6 p-4 rounded-sm ${
                            notification.type === "error"
                                ? "bg-red-50 text-red-800 border border-red-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                    >
                        <p className="text-sm">{notification.message}</p>
                    </div>
                )}

                {/* Header */}
                <div className="mb-8 lg:mb-12">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-display text-text-primary mb-2">
                        Shopping Cart
                    </h1>
                    <p className="text-sm lg:text-base text-text-secondary">
                        {totalItems} {totalItems === 1 ? "item" : "items"}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Cart Items Column */}
                    <div className="lg:col-span-2">
                        <div className="space-y-4">
                            {cart.items.map((item, index) => (
                                <CartCard
                                    key={`${typeof item.productId === "object" ? item.productId._id : item.productId}-${typeof item.variantId === "object" ? item.variantId._id : item.variantId}`}
                                    item={item}
                                    onQuantityAdjusted={handleQuantityAdjusted}
                                />
                            ))}
                        </div>

                        {/* Add from Favourites Button */}
                        <div className="mt-6">
                            <Link
                                to="/wishlist"
                                className="inline-block px-8 py-3 bg-accent-1 text-sm text-text-primary-invert font-medium rounded-xs hover:bg-accent-1/90 transition-colors"
                            >
                                ADD FROM WISHLIST
                            </Link>
                        </div>
                    </div>

                    {/* Order Summary Column */}
                    <div className="lg:col-span-1">
                        <div className="rounded-xs bg-[#f2efec] p-6 lg:sticky lg:top-24">
                            <h2 className="text-xl font-medium text-text-primary mb-5">
                                Order Summary
                            </h2>

                            {/* Coupon Section */}
                            <CouponSection />

                            {/* Divider */}
                            <div className="border-t border-neutral-200 my-5"></div>

                            {/* Pricing rows */}
                            <div className="space-y-3 mb-5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary">
                                        Subtotal ({totalItems}{" "}
                                        {totalItems === 1 ? "item" : "items"})
                                    </span>
                                    <span className="font-medium text-text-primary/70">
                                        {formatPrice(subtotal)}
                                    </span>
                                </div>

                                {/* Coupon discount row */}
                                {appliedCoupon && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-700">
                                            Coupon ({appliedCoupon.code})
                                        </span>
                                        <span className="text-green-700 font-medium">
                                            −{formatPrice(discount)}
                                        </span>
                                    </div>
                                )}

                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary">
                                        Shipping
                                    </span>
                                    <span className="text-green-700 font-medium">
                                        Free
                                    </span>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-neutral-200 my-5"></div>

                            {/* Total */}
                            <div className="flex justify-between mb-1">
                                <span className="text-lg font-medium text-text-primary/80">
                                    Estimated Total
                                </span>
                                <span className="text-2xl font-semibold text-text-primary">
                                    {formatPrice(estimatedTotal)}
                                </span>
                            </div>
                            <p className="text-xs text-text-secondary mb-6">
                                Inclusive of 3% GST
                            </p>

                            {/* Checkout Button */}
                            <Link
                                to="/checkout"
                                className="block w-full px-6 py-4 bg-text-primary text-white text-center font-medium rounded-sm hover:bg-text-secondary transition-colors"
                            >
                                PROCEED TO CHECKOUT
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
