import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
} from "react";
import {
    getCart,
    addToCart as addToCartAPI,
    updateCartItem as updateCartItemAPI,
    removeFromCart as removeFromCartAPI,
    clearCart as clearCartAPI,
    mergeCart as mergeCartAPI,
    getCartCount as getCartCountAPI,
} from "../api/cart.api";
import { applyCoupon as applyCouponAPI } from "../api/coupon.api";
import { useAuth } from "./AuthContext";
import logger from "../utils/logger.util";

const CartContext = createContext(null);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within CartProvider");
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [cart, setCart] = useState({
        items: [],
        totalQuantity: 0,
        totalPrice: 0,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasMerged, setHasMerged] = useState(false);

    // Coupon state
    const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, description, discountType, discountValue, discountAmount, finalAmount }
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState(null);
    // Track last applied code so we can silently refresh on cart changes
    const appliedCouponCodeRef = useRef(null);

    /**
     * Calculate cart totals
     */
    const calculateTotals = (items) => {
        let totalQuantity = 0;
        let totalPrice = 0;

        for (const item of items) {
            totalQuantity += item.quantity;
            // Calculate price from populated variant data
            // Handle both populated (variantId is object) and separate variant field
            const variant = item.variantId?.sellingPrice
                ? item.variantId
                : item.variant;

            if (variant?.sellingPrice) {
                totalPrice += variant.sellingPrice * item.quantity;
            }
        }

        return { totalQuantity, totalPrice };
    };

    /**
     * Build cart items payload for coupon API
     */
    const buildCouponCartItems = (items) => {
        return items
            .filter((item) => !item._isPlaceholder)
            .map((item) => ({
                price:
                    (item.variantId?.sellingPrice
                        ? item.variantId
                        : item.variant
                    )?.sellingPrice || 0,
                quantity: item.quantity,
            }));
    };

    /**
     * Silently refresh the applied coupon discount after cart changes.
     * If the coupon is no longer valid (e.g. minOrderValue not met), clears it.
     */
    const refreshAppliedCoupon = async (items) => {
        const code = appliedCouponCodeRef.current;
        if (!code || !items || items.length === 0) return;

        try {
            const cartItems = buildCouponCartItems(items);
            if (cartItems.length === 0) {
                setAppliedCoupon(null);
                appliedCouponCodeRef.current = null;
                return;
            }
            const resp = await applyCouponAPI(code, cartItems);
            const data = resp.data.data;
            setAppliedCoupon({
                code: data.code,
                description: data.description,
                discountType: data.discountType,
                discountValue: data.discountValue,
                discountAmount: data.discountAmount,
                finalAmount: data.finalAmount,
            });
        } catch (err) {
            // Coupon no longer valid — clear silently
            const reason =
                err.response?.data?.message ||
                "Coupon removed (no longer applicable)";
            logger.warn(`Coupon auto-removed: ${reason}`);
            setAppliedCoupon(null);
            appliedCouponCodeRef.current = null;
            setCouponError(reason);
        }
    };

    /**
     * Apply a coupon code to the cart
     */
    const applyCartCoupon = async (code) => {
        if (!code?.trim()) return;
        setCouponLoading(true);
        setCouponError(null);
        try {
            const cartItems = buildCouponCartItems(cart.items);
            const resp = await applyCouponAPI(
                code.trim().toUpperCase(),
                cartItems,
            );
            const data = resp.data.data;
            setAppliedCoupon({
                code: data.code,
                description: data.description,
                discountType: data.discountType,
                discountValue: data.discountValue,
                discountAmount: data.discountAmount,
                finalAmount: data.finalAmount,
            });
            appliedCouponCodeRef.current = data.code;
            logger.info("Coupon applied", { code: data.code });
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to apply coupon";
            setCouponError(msg);
            logger.error("Failed to apply coupon:", msg);
        } finally {
            setCouponLoading(false);
        }
    };

    /**
     * Remove the currently applied coupon
     */
    const removeCartCoupon = () => {
        setAppliedCoupon(null);
        appliedCouponCodeRef.current = null;
        setCouponError(null);
        logger.info("Coupon removed");
    };

    /**
     * Reset cart and merge flag on logout
     */
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            // User logged out - reset cart state, merge flag, and coupon
            setCart({
                items: [],
                totalQuantity: 0,
                totalPrice: 0,
            });
            setHasMerged(false);
            setAppliedCoupon(null);
            appliedCouponCodeRef.current = null;
            setCouponError(null);
            logger.info("Cart state reset on logout");
        }
    }, [isAuthenticated, authLoading]);

    /**
     * Load cart from backend or localStorage
     * Also handles merging guest cart on login
     */
    useEffect(() => {
        const loadCart = async () => {
            if (authLoading) return; // Wait for auth to initialize

            try {
                setIsLoading(true);

                if (isAuthenticated) {
                    // Check if there's a guest cart that needs merging first
                    const storedCart = localStorage.getItem("cart");

                    if (storedCart && !hasMerged) {
                        try {
                            // Parse guest cart
                            const guestCartData = JSON.parse(storedCart);
                            const guestItems = Array.isArray(guestCartData)
                                ? guestCartData
                                : guestCartData.items || [];

                            if (guestItems.length > 0) {
                                logger.info("Merging guest cart on login", {
                                    itemCount: guestItems.length,
                                });

                                // Merge with backend
                                const response = await mergeCartAPI(guestItems);
                                const mergedCart = response.data.data;

                                // Calculate totals
                                const totals = calculateTotals(
                                    mergedCart.items,
                                );

                                setCart({
                                    items: mergedCart.items,
                                    ...totals,
                                });

                                // Clear guest cart from localStorage
                                localStorage.removeItem("cart");
                                setHasMerged(true);

                                logger.info("Guest cart merged successfully", {
                                    finalItemCount: mergedCart.items.length,
                                });

                                setIsLoading(false);
                                return;
                            }
                        } catch (mergeErr) {
                            logger.error(
                                "Failed to merge guest cart:",
                                mergeErr,
                            );
                            // Clear guest cart and continue to load authenticated cart
                            localStorage.removeItem("cart");
                        }

                        setHasMerged(true);
                    }

                    // Load authenticated user's cart from backend
                    const response = await getCart();
                    const cartData = response.data.data || {
                        userId: null,
                        items: [],
                        lastActivityAt: new Date(),
                    };

                    // Calculate totals
                    const totals = calculateTotals(cartData.items);

                    const normalizedCart = {
                        items: cartData.items,
                        ...totals,
                    };

                    setCart(normalizedCart);

                    logger.info("Cart loaded from backend", {
                        itemCount: cartData.items.length,
                    });
                } else {
                    // Load from localStorage for guest users
                    const storedCart = localStorage.getItem("cart");
                    if (storedCart) {
                        try {
                            const cartData = JSON.parse(storedCart);
                            // Guest cart is just an array of items
                            const items = Array.isArray(cartData)
                                ? cartData
                                : cartData.items || [];

                            if (items.length > 0) {
                                // Fetch product details from backend
                                const response = await getCart(items);
                                const validatedCart = response.data.data || {
                                    items: [],
                                };

                                // Calculate totals
                                const totals = calculateTotals(
                                    validatedCart.items,
                                );

                                const normalizedCart = {
                                    items: validatedCart.items,
                                    ...totals,
                                };

                                setCart(normalizedCart);

                                // Update localStorage with validated items
                                const updatedGuestCart =
                                    validatedCart.items.map((item) => ({
                                        productId:
                                            typeof item.productId === "object"
                                                ? item.productId._id
                                                : item.productId,
                                        variantId:
                                            typeof item.variantId === "object"
                                                ? item.variantId._id
                                                : item.variantId,
                                        quantity: item.quantity,
                                    }));
                                localStorage.setItem(
                                    "cart",
                                    JSON.stringify(updatedGuestCart),
                                );

                                logger.info(
                                    "Guest cart loaded and validated from backend",
                                    {
                                        itemCount: validatedCart.items.length,
                                    },
                                );
                            } else {
                                setCart({
                                    items: [],
                                    totalQuantity: 0,
                                    totalPrice: 0,
                                });
                            }
                        } catch (err) {
                            logger.error(
                                "Failed to load guest cart from backend:",
                                err,
                            );
                            // Fallback to empty cart
                            setCart({
                                items: [],
                                totalQuantity: 0,
                                totalPrice: 0,
                            });
                            localStorage.removeItem("cart");
                        }
                    }
                }
            } catch (err) {
                logger.error("Failed to load cart:", err);
                setError("Failed to load cart");
            } finally {
                setIsLoading(false);
            }
        };

        loadCart();
    }, [isAuthenticated, authLoading]);

    /**
     * Add item to cart
     */
    const addToCart = async (productId, variantId, quantity = 1) => {
        try {
            setError(null);

            if (isAuthenticated) {
                // Optimistic update - add placeholder immediately
                const placeholderItem = {
                    productId: { _id: productId },
                    variantId: { _id: variantId },
                    quantity,
                    _isPlaceholder: true,
                };

                setCart((prev) => ({
                    items: [...prev.items, placeholderItem],
                    totalQuantity: prev.totalQuantity + quantity,
                    totalPrice: prev.totalPrice,
                }));

                // Add to backend
                const response = await addToCartAPI(
                    productId,
                    variantId,
                    quantity,
                );
                const updatedCart = response.data.data;

                // Calculate totals
                const totals = calculateTotals(updatedCart.items);

                setCart({
                    items: updatedCart.items,
                    ...totals,
                });

                logger.info("Item added to cart", {
                    productId,
                    variantId,
                    quantity,
                });
            } else {
                // Add to localStorage cart for guest
                const storedCart = localStorage.getItem("cart");
                let currentItems = [];

                if (storedCart) {
                    try {
                        const cartData = JSON.parse(storedCart);
                        currentItems = Array.isArray(cartData)
                            ? cartData
                            : cartData.items || [];
                    } catch (err) {
                        logger.error("Failed to parse localStorage cart:", err);
                    }
                }

                // Add new item
                const newItem = {
                    productId,
                    variantId,
                    quantity,
                };

                const updatedItems = [...currentItems, newItem];
                localStorage.setItem("cart", JSON.stringify(updatedItems));

                // Fetch full product details from backend
                const response = await getCart(updatedItems);
                const validatedCart = response.data.data || { items: [] };

                // Calculate totals
                const totals = calculateTotals(validatedCart.items);

                setCart({
                    items: validatedCart.items,
                    ...totals,
                });

                logger.info("Item added to guest cart", {
                    productId,
                    variantId,
                    quantity,
                });
            }

            return true;
        } catch (err) {
            logger.error("Failed to add to cart:", err);
            setError(err.response?.data?.message || "Failed to add to cart");

            // Revert optimistic update on error
            if (isAuthenticated) {
                try {
                    const response = await getCart();
                    const cartData = response.data.data;
                    const totals = calculateTotals(cartData.items);
                    setCart({
                        items: cartData.items,
                        ...totals,
                    });
                } catch (revertErr) {
                    logger.error("Failed to revert cart:", revertErr);
                }
            }

            return false;
        }
    };

    /**
     * Update cart item quantity
     */
    const updateCartItem = async (productId, variantId, quantity) => {
        try {
            setError(null);

            if (isAuthenticated) {
                // Client-side validation before optimistic update
                const item = cart.items.find(
                    (item) =>
                        item.productId._id === productId &&
                        item.variantId._id === variantId,
                );

                if (!item) {
                    const errorMsg = "Item not found in cart";
                    setError(errorMsg);
                    return {
                        success: false,
                        adjusted: false,
                        error: errorMsg,
                    };
                }

                // Validate quantity
                if (quantity <= 0) {
                    const errorMsg = "Quantity must be at least 1";
                    setError(errorMsg);
                    return {
                        success: false,
                        adjusted: false,
                        error: errorMsg,
                    };
                }

                // Validate against available stock
                if (item.variantId?.stockQuantity) {
                    const availableStock = item.variantId.stockQuantity;
                    if (quantity > availableStock) {
                        const errorMsg = `Only ${availableStock} available in stock`;
                        setError(errorMsg);
                        logger.warn("Quantity validation failed", {
                            productId,
                            variantId,
                            requested: quantity,
                            available: availableStock,
                        });
                        return {
                            success: false,
                            adjusted: false,
                            error: errorMsg,
                            availableStock,
                        };
                    }
                }

                // Optimistic update
                setCart((prev) => ({
                    ...prev,
                    items: prev.items.map((item) =>
                        item.productId._id === productId &&
                        item.variantId._id === variantId
                            ? { ...item, quantity }
                            : item,
                    ),
                }));

                // Update on backend
                const response = await updateCartItemAPI(
                    productId,
                    variantId,
                    quantity,
                );
                const updatedCart = response.data.data;

                // Calculate totals
                const totals = calculateTotals(updatedCart.items);

                setCart({
                    items: updatedCart.items,
                    ...totals,
                });

                // Check if backend adjusted the quantity (race condition: stock changed)
                const updatedItem = updatedCart.items.find(
                    (item) =>
                        item.productId._id === productId &&
                        item.variantId._id === variantId,
                );

                const wasAdjusted =
                    updatedItem && updatedItem.quantity !== quantity;

                if (wasAdjusted) {
                    logger.info("Quantity adjusted by backend", {
                        productId,
                        variantId,
                        requested: quantity,
                        adjusted: updatedItem.quantity,
                    });
                } else {
                    logger.info("Cart item updated", {
                        productId,
                        variantId,
                        quantity,
                    });
                }

                return {
                    success: true,
                    adjusted: wasAdjusted,
                    actualQuantity: updatedItem?.quantity,
                    requestedQuantity: quantity,
                };
            } else {
                // Guest users - update in localStorage and fetch updated details
                const storedCart = localStorage.getItem("cart");
                let currentItems = [];

                if (storedCart) {
                    try {
                        const cartData = JSON.parse(storedCart);
                        currentItems = Array.isArray(cartData)
                            ? cartData
                            : cartData.items || [];
                    } catch (err) {
                        logger.error("Failed to parse localStorage cart:", err);
                    }
                }

                const updatedItems = currentItems.map((item) =>
                    item.productId === productId && item.variantId === variantId
                        ? { ...item, quantity }
                        : item,
                );

                localStorage.setItem("cart", JSON.stringify(updatedItems));

                // Fetch full product details from backend
                const response = await getCart(updatedItems);
                const validatedCart = response.data.data || { items: [] };

                // Calculate totals
                const totals = calculateTotals(validatedCart.items);

                setCart({
                    items: validatedCart.items,
                    ...totals,
                });

                logger.info("Guest cart item updated", {
                    productId,
                    variantId,
                    quantity,
                });

                return { success: true, adjusted: false };
            }
        } catch (err) {
            logger.error("Failed to update cart item:", err);
            const errorMsg =
                err.response?.data?.message || "Failed to update cart";
            setError(errorMsg);

            // Revert on error
            if (isAuthenticated) {
                try {
                    const response = await getCart();
                    const cartData = response.data.data;
                    const totals = calculateTotals(cartData.items);
                    setCart({
                        items: cartData.items,
                        ...totals,
                    });
                } catch (revertErr) {
                    logger.error("Failed to revert cart:", revertErr);
                }
            }

            return { success: false, adjusted: false, error: errorMsg };
        }
    };

    /**
     * Remove item from cart
     */
    const removeFromCart = async (productId, variantId) => {
        try {
            setError(null);

            if (isAuthenticated) {
                // Optimistic update
                setCart((prev) => ({
                    ...prev,
                    items: prev.items.filter(
                        (item) =>
                            !(
                                item.productId._id === productId &&
                                item.variantId._id === variantId
                            ),
                    ),
                }));

                // Remove from backend
                const response = await removeFromCartAPI(productId, variantId);
                const updatedCart = response.data.data;

                // Calculate totals
                const totals = calculateTotals(updatedCart.items);

                setCart({
                    items: updatedCart.items,
                    ...totals,
                });

                logger.info("Item removed from cart", { productId, variantId });
            } else {
                // Remove from localStorage
                const storedCart = localStorage.getItem("cart");
                let currentItems = [];

                if (storedCart) {
                    try {
                        const cartData = JSON.parse(storedCart);
                        currentItems = Array.isArray(cartData)
                            ? cartData
                            : cartData.items || [];
                    } catch (err) {
                        logger.error("Failed to parse localStorage cart:", err);
                    }
                }

                const updatedItems = currentItems.filter(
                    (item) =>
                        !(
                            item.productId === productId &&
                            item.variantId === variantId
                        ),
                );

                localStorage.setItem("cart", JSON.stringify(updatedItems));

                if (updatedItems.length > 0) {
                    // Fetch full product details from backend
                    const response = await getCart(updatedItems);
                    const validatedCart = response.data.data || { items: [] };

                    // Calculate totals
                    const totals = calculateTotals(validatedCart.items);

                    setCart({
                        items: validatedCart.items,
                        ...totals,
                    });
                } else {
                    // Cart is empty
                    setCart({
                        items: [],
                        totalQuantity: 0,
                        totalPrice: 0,
                    });
                }

                logger.info("Item removed from guest cart", {
                    productId,
                    variantId,
                });
            }

            return true;
        } catch (err) {
            logger.error("Failed to remove from cart:", err);
            setError(
                err.response?.data?.message || "Failed to remove from cart",
            );

            // Revert on error
            if (isAuthenticated) {
                try {
                    const response = await getCart();
                    const cartData = response.data.data;
                    const totals = calculateTotals(cartData.items);
                    setCart({
                        items: cartData.items,
                        ...totals,
                    });
                } catch (revertErr) {
                    logger.error("Failed to revert cart:", revertErr);
                }
            }

            return false;
        }
    };

    /**
     * Clear entire cart
     */
    const clearCart = async () => {
        try {
            setError(null);

            if (isAuthenticated) {
                // Clear on backend
                await clearCartAPI();
            }

            // Clear local state and localStorage
            const emptyCart = { items: [], totalQuantity: 0, totalPrice: 0 };
            setCart(emptyCart);
            localStorage.removeItem("cart");

            logger.info("Cart cleared");
            return true;
        } catch (err) {
            logger.error("Failed to clear cart:", err);
            setError(err.response?.data?.message || "Failed to clear cart");
            return false;
        }
    };

    /**
     * Refresh cart from backend
     */
    const refreshCart = async () => {
        if (!isAuthenticated) return;

        try {
            setIsLoading(true);
            const response = await getCart();
            const cartData = response.data.data;

            // Calculate totals
            const totals = calculateTotals(cartData.items);

            setCart({
                items: cartData.items,
                ...totals,
            });

            logger.info("Cart refreshed");
        } catch (err) {
            logger.error("Failed to refresh cart:", err);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Auto-refresh coupon when cart items change (authenticated only)
     */
    useEffect(() => {
        if (
            isAuthenticated &&
            appliedCouponCodeRef.current &&
            cart.items.length > 0
        ) {
            refreshAppliedCoupon(cart.items);
        }
        if (cart.items.length === 0 && appliedCouponCodeRef.current) {
            setAppliedCoupon(null);
            appliedCouponCodeRef.current = null;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cart.items]);

    /**
     * Get cart item count
     */
    const getCartCount = () => {
        return cart.items.reduce((total, item) => total + item.quantity, 0);
    };

    /**
     * Get cart total price
     */
    const getCartTotal = () => {
        return cart.totalPrice;
    };

    /**
     * Check if item is in cart
     */
    const isInCart = (productId, variantId) => {
        return cart.items.some(
            (item) =>
                (item.productId._id || item.productId) === productId &&
                (item.variantId._id || item.variantId) === variantId,
        );
    };

    const value = {
        cart,
        isLoading,
        error,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        refreshCart,
        getCartCount,
        getCartTotal,
        isInCart,
        // Coupon
        appliedCoupon,
        couponLoading,
        couponError,
        setCouponError,
        applyCartCoupon,
        removeCartCoupon,
    };

    return (
        <CartContext.Provider value={value}>{children}</CartContext.Provider>
    );
};
