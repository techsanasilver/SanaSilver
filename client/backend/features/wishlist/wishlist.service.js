import Wishlist from "./wishlist.model.js";
import Product from "../products/product.model.js";
import ProductVariant from "../products/product-variant.model.js";
import * as cartService from "../cart/cart.service.js";
import { getImageVariants } from "../../shared/utils/cloudinary.util.js";
import logger from "../../shared/utils/logger.util.js";

/**
 * Get or create wishlist for user
 */
export const getOrCreateWishlist = async (userId) => {
    try {
        let wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            wishlist = await Wishlist.create({
                userId,
                items: [],
            });
            logger.info(
                `Wishlist created for user: ${userId}`,
                "wishlist.service",
            );
        }

        return wishlist;
    } catch (error) {
        logger.error("Error getting or creating wishlist:", error.message);
        throw error;
    }
};

/**
 * Get wishlist with populated product and variant details
 * Auto-removes inactive items
 */
export const getWishlistWithDetails = async (userId) => {
    try {
        const wishlist = await getOrCreateWishlist(userId);

        // Populate product and variant details with all necessary fields
        await wishlist.populate([
            {
                path: "items.productId",
                select: "name slug description images isActive minPrice category subcategory",
            },
            {
                path: "items.variantId",
                select: "sku variantName attributes sellingPrice mrp stockQuantity isActive images weight dimensions",
            },
        ]);

        // Filter out items with inactive products or variants
        const validItems = [];
        const removedItems = [];

        for (const item of wishlist.items) {
            const product = item.productId;
            const variant = item.variantId;

            // Check if product or variant is null (deleted) or inactive
            if (
                !product ||
                !variant ||
                !product.isActive ||
                !variant.isActive
            ) {
                removedItems.push(product ? product.name : "Unknown Product");
                continue;
            }

            // Generate image URL variants for product
            if (product.images && product.images.length > 0) {
                product.images = product.images.map((img) => {
                    const imgObj = img.toObject ? img.toObject() : img;
                    return {
                        ...imgObj,
                        urls: getImageVariants(imgObj.publicId),
                    };
                });
            }

            // Generate image URL variants for variant
            if (variant.images && variant.images.length > 0) {
                variant.images = variant.images.map((img) => {
                    const imgObj = img.toObject ? img.toObject() : img;
                    return {
                        ...imgObj,
                        urls: getImageVariants(imgObj.publicId),
                    };
                });
            }

            validItems.push(item);
        }

        // Update wishlist if items were removed
        let hasChanges = false;
        if (validItems.length !== wishlist.items.length) {
            hasChanges = true;
            wishlist.items = validItems;
            await wishlist.save();
            logger.info(
                `Removed ${removedItems.length} invalid items from wishlist for user: ${userId}`,
            );
        }

        // Prepare response data
        const responseData = {
            userId: wishlist.userId,
            items: validItems,
            createdAt: wishlist.createdAt,
            updatedAt: wishlist.updatedAt,
        };

        // Add notifications if items were removed
        if (hasChanges && removedItems.length > 0) {
            responseData.notifications = {
                removedItems,
            };
        }

        return responseData;
    } catch (error) {
        logger.error("Error getting wishlist with details:", error.message);
        throw error;
    }
};

/**
 * Get wishlist IDs only (lightweight, for frontend heart state checks)
 */
export const getWishlistIds = async (userId) => {
    try {
        const wishlist = await Wishlist.findOne({ userId }).select(
            "items.productId items.variantId",
        );

        if (!wishlist) {
            return { items: [] };
        }

        return {
            items: wishlist.items.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
            })),
        };
    } catch (error) {
        logger.error("Error getting wishlist IDs:", error.message);
        throw error;
    }
};

/**
 * Add item to wishlist
 */
export const addItemToWishlist = async (userId, productId, variantId) => {
    try {
        // Validate product exists and is active
        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
            throw new Error("Product not found or unavailable");
        }

        // Validate variant exists and is active
        const variant = await ProductVariant.findById(variantId);
        if (!variant || !variant.isActive) {
            throw new Error("Variant not found or unavailable");
        }

        // Get or create wishlist
        const wishlist = await getOrCreateWishlist(userId);

        // Check if item already exists in wishlist
        const existingItem = wishlist.items.find(
            (item) =>
                item.productId.toString() === productId &&
                item.variantId.toString() === variantId,
        );

        if (existingItem) {
            throw new Error("Item already in wishlist");
        }

        // Add item to wishlist
        wishlist.items.push({
            productId,
            variantId,
            addedAt: new Date(),
        });

        await wishlist.save();

        logger.info(
            `Item added to wishlist for user: ${userId}, product: ${productId}, variant: ${variantId}`,
        );

        // Return populated wishlist with details
        return await getWishlistWithDetails(userId);
    } catch (error) {
        logger.error("Error adding item to wishlist:", error.message);
        throw error;
    }
};

/**
 * Remove item from wishlist
 */
export const removeItemFromWishlist = async (userId, productId, variantId) => {
    try {
        const wishlist = await getOrCreateWishlist(userId);

        // Filter out the item to remove
        const initialLength = wishlist.items.length;
        wishlist.items = wishlist.items.filter(
            (item) =>
                !(
                    item.productId.toString() === productId &&
                    item.variantId.toString() === variantId
                ),
        );

        // Save if items were removed
        if (wishlist.items.length !== initialLength) {
            await wishlist.save();
            logger.info(
                `Item removed from wishlist for user: ${userId}, product: ${productId}, variant: ${variantId}`,
            );
        }

        // Return populated wishlist with details
        return await getWishlistWithDetails(userId);
    } catch (error) {
        logger.error("Error removing item from wishlist:", error.message);
        throw error;
    }
};

/**
 * Clear entire wishlist
 */
export const clearWishlist = async (userId) => {
    try {
        const wishlist = await getOrCreateWishlist(userId);

        wishlist.items = [];
        await wishlist.save();

        logger.info(`Wishlist cleared for user: ${userId}`);

        // Return populated wishlist with details (will be empty)
        return await getWishlistWithDetails(userId);
    } catch (error) {
        logger.error("Error clearing wishlist:", error.message);
        throw error;
    }
};

/**
 * Check if item exists in wishlist
 */
export const checkItemInWishlist = async (userId, productId, variantId) => {
    try {
        const wishlist = await Wishlist.findOne({ userId }).select("items");

        if (!wishlist) {
            return false;
        }

        const exists = wishlist.items.some(
            (item) =>
                item.productId.toString() === productId &&
                item.variantId.toString() === variantId,
        );

        return exists;
    } catch (error) {
        logger.error("Error checking item in wishlist:", error.message);
        throw error;
    }
};

/**
 * Get wishlist item count
 */
export const getWishlistItemCount = async (userId) => {
    try {
        const wishlist = await Wishlist.findOne({ userId }).select("items");

        if (!wishlist) {
            return 0;
        }

        return wishlist.items.length;
    } catch (error) {
        logger.error("Error getting wishlist item count:", error.message);
        throw error;
    }
};

/**
 * Move item from wishlist to cart
 */
export const moveToCart = async (
    userId,
    productId,
    variantId,
    quantity = 1,
) => {
    try {
        // Validate product and variant exist and are active
        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
            throw new Error("Product not found or unavailable");
        }

        const variant = await ProductVariant.findById(variantId);
        if (!variant || !variant.isActive) {
            throw new Error("Variant not found or unavailable");
        }

        // Check stock availability
        if (variant.stockQuantity < quantity) {
            throw new Error(
                `Insufficient stock. Only ${variant.stockQuantity} items available`,
            );
        }

        // Remove from wishlist
        const wishlist = await removeItemFromWishlist(
            userId,
            productId,
            variantId,
        );

        // Add to cart
        const cart = await cartService.addItemToCart(
            userId,
            productId,
            variantId,
            quantity,
        );

        logger.info(
            `Item moved from wishlist to cart for user: ${userId}, product: ${productId}, variant: ${variantId}`,
        );

        return {
            wishlist,
            cart,
        };
    } catch (error) {
        logger.error("Error moving item to cart:", error.message);
        throw error;
    }
};
