import express from "express";
import * as wishlistController from "./wishlist.controller.js";
import authMiddleware from "../../shared/middlewares/auth.middleware.js";

const router = express.Router();

// All wishlist routes require authentication

// Get wishlist with full product details
router.get("/", authMiddleware, wishlistController.getWishlist);

// Get wishlist IDs only (lightweight for heart state checks)
router.get("/ids", authMiddleware, wishlistController.getWishlistIds);

// Add item to wishlist
router.post("/add", authMiddleware, wishlistController.addToWishlist);

// Remove item from wishlist
router.delete("/remove", authMiddleware, wishlistController.removeFromWishlist);

// Clear entire wishlist
router.delete("/clear", authMiddleware, wishlistController.clearWishlist);

// Check if item exists in wishlist
router.post("/check", authMiddleware, wishlistController.checkItemInWishlist);

// Get wishlist item count
router.get("/count", authMiddleware, wishlistController.getWishlistCount);

// Move item from wishlist to cart
router.post("/move-to-cart", authMiddleware, wishlistController.moveToCart);

export default router;
