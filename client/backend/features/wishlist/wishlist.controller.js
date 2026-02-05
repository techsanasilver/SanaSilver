import * as wishlistService from "./wishlist.service.js";
import apiResponse from "../../shared/utils/response.util.js";
import logger from "../../shared/utils/logger.util.js";

/**
 * Get wishlist with full product details
 */
export const getWishlist = async (req, res) => {
    try {
        const wishlist = await wishlistService.getWishlistWithDetails(
            req.user.userId,
        );

        return apiResponse.success(
            res,
            "Wishlist retrieved successfully",
            wishlist,
        );
    } catch (error) {
        logger.error("Get wishlist error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Get wishlist IDs only (lightweight for heart state checks)
 */
export const getWishlistIds = async (req, res) => {
    try {
        const data = await wishlistService.getWishlistIds(req.user.userId);

        return apiResponse.success(
            res,
            "Wishlist IDs retrieved successfully",
            data,
        );
    } catch (error) {
        logger.error("Get wishlist IDs error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Add item to wishlist
 */
export const addToWishlist = async (req, res) => {
    try {
        const { productId, variantId } = req.body;

        if (!productId || !variantId) {
            return apiResponse.badRequest(
                res,
                "Product ID and Variant ID are required",
            );
        }

        const wishlist = await wishlistService.addItemToWishlist(
            req.user.userId,
            productId,
            variantId,
        );

        return apiResponse.success(
            res,
            "Item added to wishlist successfully",
            wishlist,
        );
    } catch (error) {
        logger.error("Add to wishlist error:", error.message);

        if (
            error.message.includes("not found") ||
            error.message.includes("unavailable") ||
            error.message.includes("already in wishlist")
        ) {
            return apiResponse.badRequest(res, error.message);
        }

        return apiResponse.error(res, error.message);
    }
};

/**
 * Remove item from wishlist
 */
export const removeFromWishlist = async (req, res) => {
    try {
        const { productId, variantId } = req.body;

        if (!productId || !variantId) {
            return apiResponse.badRequest(
                res,
                "Product ID and Variant ID are required",
            );
        }

        const wishlist = await wishlistService.removeItemFromWishlist(
            req.user.userId,
            productId,
            variantId,
        );

        return apiResponse.success(
            res,
            "Item removed from wishlist successfully",
            wishlist,
        );
    } catch (error) {
        logger.error("Remove from wishlist error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Clear entire wishlist
 */
export const clearWishlist = async (req, res) => {
    try {
        const wishlist = await wishlistService.clearWishlist(req.user.userId);

        return apiResponse.success(
            res,
            "Wishlist cleared successfully",
            wishlist,
        );
    } catch (error) {
        logger.error("Clear wishlist error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Check if item exists in wishlist
 */
export const checkItemInWishlist = async (req, res) => {
    try {
        const { productId, variantId } = req.body;

        if (!productId || !variantId) {
            return apiResponse.badRequest(
                res,
                "Product ID and Variant ID are required",
            );
        }

        const inWishlist = await wishlistService.checkItemInWishlist(
            req.user.userId,
            productId,
            variantId,
        );

        return apiResponse.success(res, "Wishlist check completed", {
            inWishlist,
        });
    } catch (error) {
        logger.error("Check wishlist error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Get wishlist item count
 */
export const getWishlistCount = async (req, res) => {
    try {
        const count = await wishlistService.getWishlistItemCount(
            req.user.userId,
        );

        return apiResponse.success(
            res,
            "Wishlist count retrieved successfully",
            { count },
        );
    } catch (error) {
        logger.error("Get wishlist count error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Move item from wishlist to cart
 */
export const moveToCart = async (req, res) => {
    try {
        const { productId, variantId, quantity = 1 } = req.body;

        if (!productId || !variantId) {
            return apiResponse.badRequest(
                res,
                "Product ID and Variant ID are required",
            );
        }

        if (quantity < 1) {
            return apiResponse.badRequest(res, "Quantity must be at least 1");
        }

        const result = await wishlistService.moveToCart(
            req.user.userId,
            productId,
            variantId,
            quantity,
        );

        return apiResponse.success(
            res,
            "Item moved to cart successfully",
            result,
        );
    } catch (error) {
        logger.error("Move to cart error:", error.message);

        if (
            error.message.includes("not found") ||
            error.message.includes("unavailable") ||
            error.message.includes("stock")
        ) {
            return apiResponse.badRequest(res, error.message);
        }

        return apiResponse.error(res, error.message);
    }
};
