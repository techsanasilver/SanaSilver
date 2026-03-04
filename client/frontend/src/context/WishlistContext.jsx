/**
 * Data Structure:
 * - items: [{ productId: {...}, variantId: {...}, addedAt: Date }]
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import {
    getWishlist,
    addToWishlist as addToWishlistAPI,
    removeFromWishlist as removeFromWishlistAPI,
    clearWishlist as clearWishlistAPI,
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
     * Load wishlist from backend
     */
    useEffect(() => {
        const loadWishlist = async () => {
            if (authLoading) return; // Wait for auth to initialize

            // Clear wishlist if user is not authenticated
            if (!isAuthenticated) {
                setWishlist([]);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                // Load from backend - returns populated items
                const response = await getWishlist();
                const wishlistData = response.data?.data?.items || [];
                setWishlist(wishlistData);

                logger.info("Wishlist loaded from backend", {
                    itemCount: wishlistData.length,
                });
            } catch (err) {
                logger.error("Failed to load wishlist:", err);
                setError("Failed to load wishlist");
                setWishlist([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadWishlist();
    }, [isAuthenticated, authLoading]);

    /**
     * Add item to wishlist (requires authentication)
     * @param {string} productId - Product ID
     * @param {string} variantId - Variant ID
     */
    const addToWishlist = async (productId, variantId) => {
        // Require authentication
        if (!isAuthenticated) {
            logger.warn("Add to wishlist attempted without authentication");
            setError("Please log in to add items to wishlist");
            return false;
        }

        // Optimistic update - add placeholder item immediately
        const placeholderItem = {
            productId,
            variantId,
            addedAt: new Date().toISOString(),
            _optimistic: true, // Mark as optimistic
        };
        setWishlist((prev) => [...prev, placeholderItem]);

        try {
            setError(null);

            // Add to backend - will return populated data
            const response = await addToWishlistAPI(productId, variantId);
            const updatedWishlist = response.data?.data?.items || [];
            setWishlist(updatedWishlist);

            logger.info("Item added to wishlist", { productId, variantId });
            return true;
        } catch (err) {
            // Rollback optimistic update on error
            setWishlist((prev) =>
                prev.filter(
                    (item) =>
                        !(
                            item.productId === productId &&
                            item.variantId === variantId &&
                            item._optimistic
                        ),
                ),
            );

            logger.error("Failed to add to wishlist:", err);
            setError(
                err.response?.data?.message || "Failed to add to wishlist",
            );
            return false;
        }
    };

    /**
     * Remove item from wishlist (requires authentication)
     * @param {string} productId - Product ID
     * @param {string} variantId - Variant ID
     */
    const removeFromWishlist = async (productId, variantId) => {
        // Require authentication
        if (!isAuthenticated) {
            logger.warn(
                "Remove from wishlist attempted without authentication",
            );
            setError("Please log in to manage your wishlist");
            return false;
        }

        // Optimistic update - remove item immediately
        const previousWishlist = [...wishlist];
        setWishlist((prev) =>
            prev.filter((item) => {
                const itemProductId =
                    typeof item.productId === "object"
                        ? item.productId._id
                        : item.productId;
                const itemVariantId =
                    typeof item.variantId === "object"
                        ? item.variantId._id
                        : item.variantId;

                return !(
                    itemProductId === productId && itemVariantId === variantId
                );
            }),
        );

        try {
            setError(null);

            // Remove from backend
            const response = await removeFromWishlistAPI(productId, variantId);
            const updatedWishlist = response.data?.data?.items || [];
            setWishlist(updatedWishlist);

            logger.info("Item removed from wishlist", { productId, variantId });
            return true;
        } catch (err) {
            // Rollback optimistic update on error
            setWishlist(previousWishlist);

            logger.error("Failed to remove from wishlist:", err);
            setError(
                err.response?.data?.message || "Failed to remove from wishlist",
            );
            return false;
        }
    };

    /**
     * Check if product+variant combo is in wishlist
     * @param {string} productId - Product ID
     * @param {string} variantId - Variant ID (optional, checks any variant if not provided)
     */
    const isInWishlist = (productId, variantId = null) => {
        // Return false if not authenticated
        if (!isAuthenticated) {
            return false;
        }

        if (variantId) {
            // Check specific product+variant combo
            return wishlist.some((item) => {
                const itemProductId =
                    typeof item.productId === "object"
                        ? item.productId._id
                        : item.productId;
                const itemVariantId =
                    typeof item.variantId === "object"
                        ? item.variantId._id
                        : item.variantId;

                return (
                    itemProductId === productId && itemVariantId === variantId
                );
            });
        } else {
            // Check if any variant of this product is wishlisted
            return wishlist.some((item) => {
                const itemProductId =
                    typeof item.productId === "object"
                        ? item.productId._id
                        : item.productId;
                return itemProductId === productId;
            });
        }
    };

    /**
     * Toggle product+variant in wishlist (requires authentication)
     * @param {string} productId - Product ID
     * @param {string} variantId - Variant ID
     */
    const toggleWishlist = async (productId, variantId) => {
        // Require authentication
        if (!isAuthenticated) {
            logger.warn("Toggle wishlist attempted without authentication");
            setError("Please log in to use wishlist");
            return false;
        }

        if (isInWishlist(productId, variantId)) {
            return await removeFromWishlist(productId, variantId);
        } else {
            return await addToWishlist(productId, variantId);
        }
    };

    /**
     * Clear entire wishlist (requires authentication)
     */
    const clearWishlist = async () => {
        // Require authentication
        if (!isAuthenticated) {
            logger.warn("Clear wishlist attempted without authentication");
            return false;
        }

        // Optimistic update - clear immediately
        const previousWishlist = [...wishlist];
        setWishlist([]);

        try {
            setError(null);

            // Clear from backend
            const response = await clearWishlistAPI();
            const updatedWishlist = response.data?.data?.items || [];
            setWishlist(updatedWishlist);

            logger.info("Wishlist cleared");
            return true;
        } catch (err) {
            // Rollback optimistic update on error
            setWishlist(previousWishlist);

            logger.error("Failed to clear wishlist:", err);
            setError(err.response?.data?.message || "Failed to clear wishlist");
            return false;
        }
    };

    /**
     * Get wishlist count
     */
    const getWishlistCount = () => {
        return wishlist.length;
    };

    /**
     * Manually refetch wishlist from backend
     * Useful for refreshing data when navigating to wishlist page
     */
    const refetchWishlist = async () => {
        if (!isAuthenticated) {
            setWishlist([]);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const response = await getWishlist();
            const wishlistData = response.data?.data?.items || [];
            setWishlist(wishlistData);

            logger.info("Wishlist refetched", {
                itemCount: wishlistData.length,
            });
        } catch (err) {
            logger.error("Failed to refetch wishlist:", err);
            setError("Failed to load wishlist");
        } finally {
            setIsLoading(false);
        }
    };

    const value = {
        wishlist,
        isLoading,
        error,
        isAuthenticated, // Expose auth state for UI decisions
        wishlistCount: wishlist.length, // Direct count for easier access
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
        clearWishlist,
        getWishlistCount,
        refetchWishlist,
    };

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    );
};
