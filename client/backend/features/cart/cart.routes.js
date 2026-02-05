import express from "express";
import * as cartController from "./cart.controller.js";
import authMiddleware from "../../shared/middlewares/auth.middleware.js";

const router = express.Router();

// Optional auth middleware - works for both guest and logged-in users
const optionalAuth = (req, res, next) => {
    // Try to authenticate, but don't fail if no token
    const token = req.cookies.accessToken;
    if (!token) {
        return next(); // Continue without authentication
    }
    // If token exists, use auth middleware
    return authMiddleware(req, res, next);
};

/**
 * @route   POST /api/cart
 * @desc    Get cart (for logged-in: from DB, for guest: validate items)
 * @access  Public (works for both guest and logged-in)
 */
router.post("/", optionalAuth, cartController.getCart);

/**
 * @route   POST /api/cart/add
 * @desc    Add item to cart
 * @access  Public (works for both guest and logged-in)
 */
router.post("/add", optionalAuth, cartController.addToCart);

/**
 * @route   PUT /api/cart/update
 * @desc    Update cart item quantity (logged-in only)
 * @access  Private
 */
router.put("/update", authMiddleware, cartController.updateCartItem);

/**
 * @route   DELETE /api/cart/remove
 * @desc    Remove item from cart (logged-in only)
 * @access  Private
 */
router.delete("/remove", authMiddleware, cartController.removeFromCart);

/**
 * @route   DELETE /api/cart/clear
 * @desc    Clear entire cart (logged-in only)
 * @access  Private
 */
router.delete("/clear", authMiddleware, cartController.clearCart);

/**
 * @route   POST /api/cart/merge
 * @desc    Merge guest cart with user cart on login
 * @access  Private
 */
router.post("/merge", authMiddleware, cartController.mergeCart);

/**
 * @route   GET /api/cart/count
 * @desc    Get cart item count
 * @access  Private
 */
router.get("/count", authMiddleware, cartController.getCartCount);

export default router;
