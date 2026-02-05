import * as cartService from "./cart.service.js";
import apiResponse from "../../shared/utils/response.util.js";
import logger from "../../shared/utils/logger.util.js";

/**
 * Get cart
 * For logged-in users: Fetch from DB
 * For guests: Validate items sent in request body
 */
export const getCart = async (req, res) => {
    try {
        // Check if user is logged in
        if (req.user && req.user.userId) {
            // Logged-in user - fetch from DB
            const cart = await cartService.getCartWithDetails(req.user.userId);
            return apiResponse.success(
                res,
                "Cart retrieved successfully",
                cart,
            );
        } else {
            // Guest user - validate items from request body
            const { items } = req.body;
            const validatedItems =
                await cartService.validateGuestCartItems(items);

            return apiResponse.success(res, "Cart validated successfully", {
                items: validatedItems,
            });
        }
    } catch (error) {
        logger.error("Get cart error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Add item to cart
 */
export const addToCart = async (req, res) => {
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

        // Check if user is logged in
        if (req.user && req.user.userId) {
            // Logged-in user - add to DB
            const cart = await cartService.addItemToCart(
                req.user.userId,
                productId,
                variantId,
                quantity,
            );
            return apiResponse.success(
                res,
                "Item added to cart successfully",
                cart,
            );
        } else {
            // Guest user - just validate and return item details
            const items = await cartService.validateGuestCartItems([
                { productId, variantId, quantity },
            ]);

            if (items.length === 0) {
                return apiResponse.badRequest(
                    res,
                    "Product not available or out of stock",
                );
            }

            return apiResponse.success(
                res,
                "Item validated successfully",
                items[0],
            );
        }
    } catch (error) {
        logger.error("Add to cart error:", error.message);

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

/**
 * Update cart item quantity
 */
export const updateCartItem = async (req, res) => {
    try {
        // Only for logged-in users (guests manage their cart on frontend)
        if (!req.user || !req.user.userId) {
            return apiResponse.unauthorized(res, "Please login to update cart");
        }

        const { productId, variantId, quantity } = req.body;

        if (!productId || !variantId || !quantity) {
            return apiResponse.badRequest(
                res,
                "Product ID, Variant ID, and quantity are required",
            );
        }

        const cart = await cartService.updateCartItemQuantity(
            req.user.userId,
            productId,
            variantId,
            quantity,
        );

        return apiResponse.success(res, "Cart updated successfully", cart);
    } catch (error) {
        logger.error("Update cart item error:", error.message);

        if (
            error.message.includes("not found") ||
            error.message.includes("stock")
        ) {
            return apiResponse.badRequest(res, error.message);
        }

        return apiResponse.error(res, error.message);
    }
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (req, res) => {
    try {
        // Only for logged-in users (guests manage their cart on frontend)
        if (!req.user || !req.user.userId) {
            return apiResponse.unauthorized(res, "Please login to remove item");
        }

        const { productId, variantId } = req.body;

        if (!productId || !variantId) {
            return apiResponse.badRequest(
                res,
                "Product ID and Variant ID are required",
            );
        }

        const cart = await cartService.removeItemFromCart(
            req.user.userId,
            productId,
            variantId,
        );

        return apiResponse.success(res, "Item removed from cart", cart);
    } catch (error) {
        logger.error("Remove from cart error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Clear entire cart
 */
export const clearCart = async (req, res) => {
    try {
        // Only for logged-in users
        if (!req.user || !req.user.userId) {
            return apiResponse.unauthorized(res, "Please login to clear cart");
        }

        const cart = await cartService.clearCart(req.user.userId);
        return apiResponse.success(res, "Cart cleared successfully", cart);
    } catch (error) {
        logger.error("Clear cart error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Merge guest cart with user cart on login
 */
export const mergeCart = async (req, res) => {
    try {
        // Only for logged-in users
        if (!req.user || !req.user.userId) {
            return apiResponse.unauthorized(res, "Please login to merge cart");
        }

        const { items } = req.body;

        const cart = await cartService.mergeGuestCart(req.user.userId, items);

        return apiResponse.success(res, "Cart merged successfully", cart);
    } catch (error) {
        logger.error("Merge cart error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Get cart item count
 */
export const getCartCount = async (req, res) => {
    try {
        // Only for logged-in users
        if (!req.user || !req.user.userId) {
            return apiResponse.success(res, "Cart count retrieved", {
                count: 0,
            });
        }

        const count = await cartService.getCartItemCount(req.user.userId);
        return apiResponse.success(res, "Cart count retrieved", { count });
    } catch (error) {
        logger.error("Get cart count error:", error.message);
        return apiResponse.error(res, error.message);
    }
};
