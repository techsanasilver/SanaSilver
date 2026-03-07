import Cart from "./cart.model.js";
import Product from "../products/product.model.js";
import ProductVariant from "../products/product-variant.model.js";
import logger from "../../shared/utils/logger.util.js";
import { getImageVariants } from "../../shared/utils/cloudinary.util.js";

/**
 * Get or create cart for user
 */
export const getOrCreateCart = async (userId) => {
    try {
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, items: [] });
            await cart.save();
            logger.info(`New cart created for user: ${userId}`);
        }

        return cart;
    } catch (error) {
        logger.error("Error getting/creating cart:", error.message);
        throw error;
    }
};

/**
 * Get cart with populated product and variant details
 */
export const getCartWithDetails = async (userId) => {
    try {
        const cart = await Cart.findOne({ userId })
            .populate({
                path: "items.productId",
                select: "name slug images isActive minPrice",
            })
            .populate({
                path: "items.variantId",
                select: "sku variantName attributes sellingPrice mrp stockQuantity isActive images weight dimensions",
            });

        if (!cart) {
            return { userId, items: [], lastActivityAt: new Date() };
        }

        // Validate and clean up cart items
        const validItems = [];
        let hasChanges = false;

        for (const item of cart.items) {
            // Check if product exists and is active
            if (!item.productId || !item.productId.isActive) {
                hasChanges = true;
                logger.info(
                    `Removed inactive product from cart: ${item.productId?._id}`,
                );
                continue;
            }

            // Check if variant exists and is active
            if (!item.variantId || !item.variantId.isActive) {
                hasChanges = true;
                logger.info(
                    `Removed inactive variant from cart: ${item.variantId?._id}`,
                );
                continue;
            }

            // Adjust quantity if exceeds available stock
            if (item.variantId.stockQuantity < item.quantity) {
                item.quantity = Math.max(item.variantId.stockQuantity, 0);
                hasChanges = true;
                logger.info(
                    `Adjusted quantity for variant ${item.variantId._id} to ${item.quantity}`,
                );
            }

            // Skip if stock is 0
            if (item.variantId.stockQuantity === 0) {
                hasChanges = true;
                logger.info(
                    `Removed out-of-stock variant from cart: ${item.variantId._id}`,
                );
                continue;
            }

            validItems.push(item);
        }

        // Update cart if there were changes
        if (hasChanges) {
            cart.items = validItems;
            await cart.save();
        }

        // Generate image URLs for product and variant images
        for (const item of cart.items) {
            if (item.productId?.images) {
                for (const img of item.productId.images) {
                    img.urls = getImageVariants(img.publicId);
                }
            }
            if (item.variantId?.images) {
                for (const img of item.variantId.images) {
                    img.urls = getImageVariants(img.publicId);
                }
            }
        }

        return cart;
    } catch (error) {
        logger.error("Error getting cart with details:", error.message);
        throw error;
    }
};

/**
 * Validate guest cart items (from localStorage)
 */
export const validateGuestCartItems = async (items) => {
    try {
        if (!items || !Array.isArray(items) || items.length === 0) {
            return [];
        }

        const validatedItems = [];

        for (const item of items) {
            if (
                !item.productId ||
                !item.variantId ||
                !item.quantity ||
                item.quantity < 1
            ) {
                continue;
            }

            // Fetch product and variant
            const product = await Product.findById(item.productId);
            const variant = await ProductVariant.findById(item.variantId);

            // Skip if product or variant doesn't exist or is inactive
            if (
                !product ||
                !product.isActive ||
                !variant ||
                !variant.isActive
            ) {
                continue;
            }

            // Adjust quantity based on stock
            const adjustedQuantity = Math.min(
                item.quantity,
                variant.stockQuantity,
            );

            if (adjustedQuantity > 0) {
                // Generate image URLs for product and variant
                const productImages = product.images || [];
                for (const img of productImages) {
                    img.urls = getImageVariants(img.publicId);
                }

                const variantImages = variant.images || [];
                for (const img of variantImages) {
                    img.urls = getImageVariants(img.publicId);
                }

                validatedItems.push({
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: adjustedQuantity,
                    product: {
                        _id: product._id,
                        name: product.name,
                        slug: product.slug,
                        images: productImages,
                    },
                    variant: {
                        _id: variant._id,
                        attributes: variant.attributes,
                        sellingPrice: variant.sellingPrice,
                        stockQuantity: variant.stockQuantity,
                        images: variantImages,
                    },
                });
            }
        }

        return validatedItems;
    } catch (error) {
        logger.error("Error validating guest cart items:", error.message);
        throw error;
    }
};

/**
 * Add item to cart
 */
export const addItemToCart = async (userId, productId, variantId, quantity) => {
    try {
        // Validate product and variant
        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
            throw new Error("Product not found or unavailable");
        }

        const variant = await ProductVariant.findById(variantId);
        if (!variant || !variant.isActive) {
            throw new Error("Product variant not found or unavailable");
        }

        // Check stock availability
        if (variant.stockQuantity < quantity) {
            throw new Error(
                `Only ${variant.stockQuantity} items available in stock`,
            );
        }

        if (variant.stockQuantity === 0) {
            throw new Error("Product is out of stock");
        }

        // Get or create cart
        const cart = await getOrCreateCart(userId);

        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(
            (item) =>
                item.productId.toString() === productId &&
                item.variantId.toString() === variantId,
        );

        if (existingItemIndex > -1) {
            // Update existing item quantity
            const newQuantity =
                cart.items[existingItemIndex].quantity + quantity;

            if (newQuantity > variant.stockQuantity) {
                throw new Error(
                    `Cannot add ${quantity} more. Only ${variant.stockQuantity - cart.items[existingItemIndex].quantity} items available`,
                );
            }

            cart.items[existingItemIndex].quantity = newQuantity;
            cart.items[existingItemIndex].addedAt = new Date();
        } else {
            // Add new item
            cart.items.push({
                productId,
                variantId,
                quantity,
                addedAt: new Date(),
            });
        }

        await cart.save();
        return await getCartWithDetails(userId);
    } catch (error) {
        logger.error("Error adding item to cart:", error.message);
        throw error;
    }
};

/**
 * Update item quantity in cart
 */
export const updateCartItemQuantity = async (
    userId,
    productId,
    variantId,
    quantity,
) => {
    try {
        if (quantity < 1) {
            throw new Error("Quantity must be at least 1");
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            throw new Error("Cart not found");
        }

        const itemIndex = cart.items.findIndex(
            (item) =>
                item.productId.toString() === productId &&
                item.variantId.toString() === variantId,
        );

        if (itemIndex === -1) {
            throw new Error("Item not found in cart");
        }

        // Check stock availability
        const variant = await ProductVariant.findById(variantId);
        if (!variant || !variant.isActive) {
            throw new Error("Product variant not available");
        }

        if (variant.stockQuantity < quantity) {
            throw new Error(
                `Only ${variant.stockQuantity} items available in stock`,
            );
        }

        cart.items[itemIndex].quantity = quantity;
        await cart.save();

        return await getCartWithDetails(userId);
    } catch (error) {
        logger.error("Error updating cart item quantity:", error.message);
        throw error;
    }
};

/**
 * Remove item from cart
 */
export const removeItemFromCart = async (userId, productId, variantId) => {
    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            throw new Error("Cart not found");
        }

        cart.items = cart.items.filter(
            (item) =>
                !(
                    item.productId.toString() === productId &&
                    item.variantId.toString() === variantId
                ),
        );

        await cart.save();
        return await getCartWithDetails(userId);
    } catch (error) {
        logger.error("Error removing item from cart:", error.message);
        throw error;
    }
};

/**
 * Clear entire cart
 */
export const clearCart = async (userId) => {
    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return { userId, items: [], lastActivityAt: new Date() };
        }

        cart.items = [];
        await cart.save();

        return cart;
    } catch (error) {
        logger.error("Error clearing cart:", error.message);
        throw error;
    }
};

/**
 * Merge guest cart with user cart on login
 */
export const mergeGuestCart = async (userId, guestCartItems) => {
    try {
        if (!guestCartItems || !Array.isArray(guestCartItems)) {
            return await getCartWithDetails(userId);
        }

        // Filter valid items
        const validGuestItems = guestCartItems.filter(
            (item) =>
                item.productId &&
                item.variantId &&
                item.quantity &&
                item.quantity > 0,
        );

        if (validGuestItems.length === 0) {
            return await getCartWithDetails(userId);
        }

        // Get or create user cart
        const cart = await getOrCreateCart(userId);

        // Create a map of existing cart items for quick lookup
        const existingItemsMap = new Map();
        cart.items.forEach((item) => {
            const key = `${item.productId}_${item.variantId}`;
            existingItemsMap.set(key, item);
        });

        // Process guest cart items
        for (const guestItem of validGuestItems) {
            const key = `${guestItem.productId}_${guestItem.variantId}`;

            // Validate stock
            const variant = await ProductVariant.findById(guestItem.variantId);
            if (!variant || !variant.isActive || variant.stockQuantity === 0) {
                continue; // Skip invalid items
            }

            // Adjust quantity to available stock
            const adjustedQuantity = Math.min(
                guestItem.quantity,
                variant.stockQuantity,
            );

            if (existingItemsMap.has(key)) {
                // Item exists in user cart - keep guest cart quantity (latest action)
                const existingItem = existingItemsMap.get(key);
                existingItem.quantity = adjustedQuantity;
                existingItem.addedAt = new Date();
            } else {
                // New item - add to cart
                cart.items.push({
                    productId: guestItem.productId,
                    variantId: guestItem.variantId,
                    quantity: adjustedQuantity,
                    addedAt: new Date(),
                });
            }
        }

        await cart.save();
        logger.info(`Merged guest cart for user: ${userId}`);

        return await getCartWithDetails(userId);
    } catch (error) {
        logger.error("Error merging guest cart:", error.message);
        throw error;
    }
};

/**
 * Get cart item count
 */
export const getCartItemCount = async (userId) => {
    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return 0;
        }

        return cart.items.reduce((total, item) => total + item.quantity, 0);
    } catch (error) {
        logger.error("Error getting cart item count:", error.message);
        throw error;
    }
};
