/**
 * Wishlist Context
 * Global state management for wishlist
 * Syncs with backend and localStorage
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import {
    getWishlist,
    addToWishlist as addToWishlistAPI,
    removeFromWishlist as removeFromWishlistAPI,
} from "../api/wishlist.api";
import { useAuth } from "./AuthContext";
import logger from "../utils/logger.util";

const WishlistContext = createContext(null);

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error("useWishlist must be used within WishlistProvider");
    }
    return context;
};

export const WishlistProvider = ({ children }) => {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [wishlist, setWishlist] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Load wishlist from backend or localStorage
     */
    useEffect(() => {
        const loadWishlist = async () => {
            if (authLoading) return; // Wait for auth to initialize

            try {
                setIsLoading(true);

                if (isAuthenticated) {
                    // Load from backend
                    const response = await getWishlist();
                    const wishlistData = response.data?.items || [];
                    setWishlist(wishlistData);

                    // Sync to localStorage
                    localStorage.setItem(
                        "wishlist",
                        JSON.stringify(wishlistData),
                    );

                    logger.info("Wishlist loaded from backend", {
                        itemCount: wishlistData.length,
                    });
                } else {
                    // Load from localStorage for guest users
                    const storedWishlist = localStorage.getItem("wishlist");
                    if (storedWishlist) {
                        const wishlistData = JSON.parse(storedWishlist);
                        setWishlist(wishlistData);
                        logger.info("Wishlist loaded from localStorage", {
                            itemCount: wishlistData.length,
                        });
                    }
                }
            } catch (err) {
                logger.error("Failed to load wishlist:", err);
                setError("Failed to load wishlist");
            } finally {
                setIsLoading(false);
            }
        };

        loadWishlist();
    }, [isAuthenticated, authLoading]);

    /**
     * Add item to wishlist
     */
    const addToWishlist = async (productId) => {
        try {
            setIsLoading(true);
            setError(null);

            if (isAuthenticated) {
                // Add to backend
                const response = await addToWishlistAPI(productId);
                const updatedWishlist = response.data?.items || [];
                setWishlist(updatedWishlist);
                localStorage.setItem(
                    "wishlist",
                    JSON.stringify(updatedWishlist),
                );

                logger.info("Item added to wishlist", { productId });
            } else {
                // Add to localStorage for guest
                if (!wishlist.includes(productId)) {
                    const updatedWishlist = [...wishlist, productId];
                    setWishlist(updatedWishlist);
                    localStorage.setItem(
                        "wishlist",
                        JSON.stringify(updatedWishlist),
                    );

                    logger.info("Item added to guest wishlist", { productId });
                }
            }

            return true;
        } catch (err) {
            logger.error("Failed to add to wishlist:", err);
            setError(
                err.response?.data?.message || "Failed to add to wishlist",
            );
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Remove item from wishlist
     */
    const removeFromWishlist = async (productId) => {
        try {
            setIsLoading(true);
            setError(null);

            if (isAuthenticated) {
                // Remove from backend
                const response = await removeFromWishlistAPI(productId);
                const updatedWishlist = response.data?.items || [];
                setWishlist(updatedWishlist);
                localStorage.setItem(
                    "wishlist",
                    JSON.stringify(updatedWishlist),
                );

                logger.info("Item removed from wishlist", { productId });
            } else {
                // Remove from localStorage
                const updatedWishlist = wishlist.filter(
                    (id) => id !== productId,
                );
                setWishlist(updatedWishlist);
                localStorage.setItem(
                    "wishlist",
                    JSON.stringify(updatedWishlist),
                );

                logger.info("Item removed from guest wishlist", { productId });
            }

            return true;
        } catch (err) {
            logger.error("Failed to remove from wishlist:", err);
            setError(
                err.response?.data?.message || "Failed to remove from wishlist",
            );
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Check if product is in wishlist
     */
    const isInWishlist = (productId) => {
        return wishlist.includes(productId);
    };

    /**
     * Toggle product in wishlist
     */
    const toggleWishlist = async (productId) => {
        if (isInWishlist(productId)) {
            return await removeFromWishlist(productId);
        } else {
            return await addToWishlist(productId);
        }
    };

    /**
     * Clear entire wishlist
     */
    const clearWishlist = () => {
        setWishlist([]);
        localStorage.removeItem("wishlist");
        logger.info("Wishlist cleared");
    };

    /**
     * Get wishlist count
     */
    const getWishlistCount = () => {
        return wishlist.length;
    };

    const value = {
        wishlist,
        isLoading,
        error,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
        clearWishlist,
        getWishlistCount,
    };

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    );
};
