/**
 * Cart Context
 * Global state management for shopping cart
 * Syncs with backend and localStorage
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import {
    getCart,
    addToCart as addToCartAPI,
    updateCartItem as updateCartItemAPI,
    removeFromCart as removeFromCartAPI,
    clearCart as clearCartAPI,
} from "../api/cart.api";
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

    /**
     * Load cart from backend or localStorage
     */
    useEffect(() => {
        const loadCart = async () => {
            if (authLoading) return; // Wait for auth to initialize

            try {
                setIsLoading(true);

                if (isAuthenticated) {
                    // Load from backend
                    const response = await getCart();
                    const cartData = response.data || {
                        items: [],
                        totalQuantity: 0,
                        totalPrice: 0,
                    };
                    setCart(cartData);

                    // Sync to localStorage
                    localStorage.setItem("cart", JSON.stringify(cartData));

                    logger.info("Cart loaded from backend", {
                        itemCount: cartData.items.length,
                    });
                } else {
                    // Load from localStorage for guest users
                    const storedCart = localStorage.getItem("cart");
                    if (storedCart) {
                        const cartData = JSON.parse(storedCart);
                        setCart(cartData);
                        logger.info("Cart loaded from localStorage", {
                            itemCount: cartData.items.length,
                        });
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
    const addToCart = async (productId, quantity = 1, variant = null) => {
        try {
            setIsLoading(true);
            setError(null);

            if (isAuthenticated) {
                // Add to backend
                const response = await addToCartAPI(
                    productId,
                    quantity,
                    variant,
                );
                const updatedCart = response.data;
                setCart(updatedCart);
                localStorage.setItem("cart", JSON.stringify(updatedCart));

                logger.info("Item added to cart", { productId, quantity });
            } else {
                // Add to localStorage cart for guest
                const newItem = {
                    product: productId,
                    quantity,
                    variant,
                    addedAt: new Date().toISOString(),
                };
                const updatedItems = [...cart.items, newItem];
                const updatedCart = {
                    items: updatedItems,
                    totalQuantity: cart.totalQuantity + quantity,
                    totalPrice: 0,
                };
                setCart(updatedCart);
                localStorage.setItem("cart", JSON.stringify(updatedCart));

                logger.info("Item added to guest cart", {
                    productId,
                    quantity,
                });
            }

            return true;
        } catch (err) {
            logger.error("Failed to add to cart:", err);
            setError(err.response?.data?.message || "Failed to add to cart");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Update cart item quantity
     */
    const updateCartItem = async (productId, quantity) => {
        try {
            setIsLoading(true);
            setError(null);

            if (isAuthenticated) {
                // Update on backend
                const response = await updateCartItemAPI(productId, quantity);
                const updatedCart = response.data;
                setCart(updatedCart);
                localStorage.setItem("cart", JSON.stringify(updatedCart));

                logger.info("Cart item updated", { productId, quantity });
            } else {
                // Update in localStorage
                const updatedItems = cart.items.map((item) =>
                    item.product === productId ? { ...item, quantity } : item,
                );
                const updatedCart = { ...cart, items: updatedItems };
                setCart(updatedCart);
                localStorage.setItem("cart", JSON.stringify(updatedCart));

                logger.info("Guest cart item updated", { productId, quantity });
            }

            return true;
        } catch (err) {
            logger.error("Failed to update cart item:", err);
            setError(err.response?.data?.message || "Failed to update cart");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Remove item from cart
     */
    const removeFromCart = async (productId) => {
        try {
            setIsLoading(true);
            setError(null);

            if (isAuthenticated) {
                // Remove from backend
                const response = await removeFromCartAPI(productId);
                const updatedCart = response.data;
                setCart(updatedCart);
                localStorage.setItem("cart", JSON.stringify(updatedCart));

                logger.info("Item removed from cart", { productId });
            } else {
                // Remove from localStorage
                const updatedItems = cart.items.filter(
                    (item) => item.product !== productId,
                );
                const updatedCart = { ...cart, items: updatedItems };
                setCart(updatedCart);
                localStorage.setItem("cart", JSON.stringify(updatedCart));

                logger.info("Item removed from guest cart", { productId });
            }

            return true;
        } catch (err) {
            logger.error("Failed to remove from cart:", err);
            setError(
                err.response?.data?.message || "Failed to remove from cart",
            );
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Clear entire cart
     */
    const clearCart = async () => {
        try {
            setIsLoading(true);
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
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Get cart item count
     */
    const getCartCount = () => {
        return cart.items.reduce((total, item) => total + item.quantity, 0);
    };

    const value = {
        cart,
        isLoading,
        error,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        getCartCount,
    };

    return (
        <CartContext.Provider value={value}>{children}</CartContext.Provider>
    );
};
