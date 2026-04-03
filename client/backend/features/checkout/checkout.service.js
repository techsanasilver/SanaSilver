import mongoose from "mongoose";
import Cart from "../cart/cart.model.js";
import Product from "../products/product.model.js";
import ProductVariant from "../products/product-variant.model.js";
import User from "../auth/user.model.js";
import * as orderService from "../orders/order.service.js";
import * as couponService from "../coupons/coupon.service.js";
import * as pricing from "./pricing.util.js";
import logger from "../../shared/utils/logger.util.js";

// ============================================================================
// CHECKOUT SERVICE
// ============================================================================
//
// PRICING STRATEGY:
// - Uses pre-calculated values from variant.priceBreakdown (calculated at variant creation)
// - Applies GST on discounted amounts (discount-then-tax model)
// - Distributes cart-level discounts proportionally across items
//
// COUPON SUPPORT:
// - Accepts optional couponCode parameter
// - Filters eligible items per coupon's product/category restrictions
// - Validates via couponService (dates, usage limits, minOrderValue)
// - Distributes discount proportionally across eligible items (GST-inclusive space)
// - Saves coupon snapshot on order and increments usage after commit
//
// ============================================================================
// INITIATE CHECKOUT
// ============================================================================

/**
 * Validate and calculate complete pricing for checkout
 * @param {String} userId - User ID
 * @param {Object} checkoutData - Checkout data
 * @returns {Promise<Object>} Validated checkout data with pricing
 */
const initiateCheckout = async (userId, checkoutData) => {
    try {
        const {
            shippingAddressId,
            billingAddressId,
            paymentMethod,
            customerNote,
        } = checkoutData;

        // 1. Validate user and addresses
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }

        const shippingAddress = user.addresses.id(shippingAddressId);
        if (!shippingAddress) {
            throw new Error("Shipping address not found");
        }

        let billingAddress;
        if (billingAddressId === "same_as_shipping") {
            billingAddress = shippingAddress;
        } else {
            billingAddress = user.addresses.id(billingAddressId);
            if (!billingAddress) {
                throw new Error("Billing address not found");
            }
        }

        // 2. Get cart
        const cart = await Cart.findOne({ userId })
            .populate({
                path: "items.productId",
                select: "name images purity makingChargesPerGram gstRate category subcategory",
            })
            .populate({
                path: "items.variantId",
                select: "sku variantName size color weight sellingPrice stockQuantity images gemstoneCharges priceBreakdown",
            });

        if (!cart || cart.items.length === 0) {
            throw new Error("Cart is empty");
        }

        // 3. Validate stock and calculate pricing
        const { items, pricing, warnings } = await calculateCheckoutPricing(
            cart.items,
            checkoutData.couponCode || null,
            userId,
        );

        // 4. Validate payment method
        if (!["razorpay", "cod"].includes(paymentMethod)) {
            throw new Error("Invalid payment method");
        }

        // 5. Check COD eligibility
        if (paymentMethod === "cod") {
            const codCheck = await validateCODEligibility(
                userId,
                pricing.itemsSubtotal,
            );
            if (!codCheck.allowed) {
                throw new Error(codCheck.reason);
            }
        }

        // 6. Format addresses for response
        const formattedShippingAddress = {
            name: shippingAddress.name,
            phone: shippingAddress.phone,
            line1: shippingAddress.addressLine1,
            line2: shippingAddress.addressLine2,
            city: shippingAddress.city,
            state: shippingAddress.state,
            pincode: shippingAddress.pincode,
        };

        const formattedBillingAddress =
            billingAddressId === "same_as_shipping"
                ? formattedShippingAddress
                : {
                      name: billingAddress.name,
                      phone: billingAddress.phone,
                      line1: billingAddress.addressLine1,
                      line2: billingAddress.addressLine2,
                      city: billingAddress.city,
                      state: billingAddress.state,
                      pincode: billingAddress.pincode,
                  };

        return {
            items,
            addresses: {
                shipping: formattedShippingAddress,
                billing: formattedBillingAddress,
            },
            pricing,
            paymentMethod,
            customerNote: customerNote || "",
            isValid: warnings.length === 0,
            warnings,
        };
    } catch (error) {
        logger.error(`Error initiating checkout: ${error.message}`);
        throw error;
    }
};

/**
 * Calculate pricing for all cart items
 * @param {Array} cartItems - Cart items with populated product/variant
 * @param {String} couponCode - Optional coupon code (for future coupon support)
 * @returns {Promise<Object>} Items with pricing and summary
 */
const calculateCheckoutPricing = async (
    cartItems,
    couponCode = null,
    userId = null,
) => {
    const items = [];
    const warnings = [];
    let itemsSubtotal = 0;

    for (const cartItem of cartItems) {
        const product = cartItem.productId;
        const variant = cartItem.variantId;

        // Validate product and variant exist
        if (!product || !variant) {
            warnings.push({
                item: cartItem._id,
                issue: "Product or variant not found",
            });
            continue;
        }

        // Check stock availability
        if (variant.stockQuantity < cartItem.quantity) {
            warnings.push({
                productName: product.name,
                sku: variant.sku,
                requested: cartItem.quantity,
                available: variant.stockQuantity,
                issue: "Insufficient stock",
            });
            continue;
        }

        // Use pre-calculated values from variant's priceBreakdown if available.
        // Fallback: back-calculate from sellingPrice (which is GST-inclusive) when
        // priceBreakdown is empty (admin hasn't computed it yet).
        const priceBreakdown = variant.priceBreakdown || {};
        const gstRate =
            priceBreakdown.gstRate || product.gstRate || pricing.GST_RATE;

        const metalValue = priceBreakdown.metalValue || 0;
        const makingCharges = priceBreakdown.makingCharges || 0;
        const gemstoneCharges = priceBreakdown.gemstoneCharges || 0;

        let itemSubtotal;
        if (priceBreakdown.subtotal > 0) {
            // priceBreakdown is populated — use it directly (already pre-GST)
            itemSubtotal = priceBreakdown.subtotal;
        } else if (variant.sellingPrice > 0) {
            // sellingPrice is GST-inclusive — back-calculate the pre-GST base price
            itemSubtotal = pricing.roundPrice(
                variant.sellingPrice / (1 + gstRate / 100),
            );
        } else {
            itemSubtotal = 0;
        }

        // Calculate total for quantity
        const quantitySubtotal = itemSubtotal * cartItem.quantity;
        itemsSubtotal += quantitySubtotal;

        items.push({
            product: {
                _id: product._id,
                name: product.name,
                images: product.images,
                purity: product.purity,
                category: product.category,
                subcategory: product.subcategory,
            },
            variant: {
                _id: variant._id,
                sku: variant.sku,
                variantName: variant.variantName,
                size: variant.size,
                color: variant.color,
                weight: variant.weight,
                sellingPrice: variant.sellingPrice,
                stockQuantity: variant.stockQuantity,
                images: variant.images,
            },
            quantity: cartItem.quantity,
            weight: variant.weight,
            metalValue: pricing.roundPrice(metalValue),
            makingCharges: pricing.roundPrice(makingCharges),
            gemstoneCharges: pricing.roundPrice(gemstoneCharges),
            sellingPrice: variant.sellingPrice,
            baseAmount: pricing.roundPrice(quantitySubtotal),
            gstRate,
        });
    }

    // Calculate cart-level discount (coupon support)
    let cartDiscount = 0; // pre-GST equivalent, used for item-level distribution
    let couponFaceValue = 0; // GST-inclusive face value stored in order & shown to customer
    let couponInfo = null;
    let eligibleItems = items;

    // Apply coupon if provided
    if (couponCode) {
        try {
            // Smart coupon validation:
            // 1. Pre-fetch coupon to determine product/category restrictions
            // 2. Filter eligible checkout items first
            // 3. Check minOrderValue against eligible items' GST-inclusive total only
            //    — restricted coupons check only the products they apply to,
            //    — and GST-inclusive sellingPrice is used (matches what the customer sees)
            const couponDoc = await couponService.getCouponByCode(couponCode);
            if (!couponDoc) {
                warnings.push({
                    issue: `Coupon '${couponCode}' is invalid — skipped.`,
                });
            } else {
                const eligibleForCoupon = filterEligibleItems(items, couponDoc);

                // GST-inclusive eligible total for minOrderValue check
                const eligibleSellingPriceTotal = eligibleForCoupon.reduce(
                    (sum, item) =>
                        sum + (item.variant.sellingPrice || 0) * item.quantity,
                    0,
                );

                const validation = await couponService.validateCoupon(
                    couponCode,
                    userId,
                    eligibleSellingPriceTotal,
                );

                if (validation.valid) {
                    const coupon = validation.coupon;

                    eligibleItems = eligibleForCoupon;

                    if (eligibleItems.length === 0) {
                        warnings.push({
                            issue: "No items in your cart are eligible for this coupon",
                        });
                    } else {
                        // Pre-GST eligible subtotal (for proportional back-calculation)
                        const eligibleSubtotal = eligibleItems.reduce(
                            (sum, item) => sum + item.baseAmount,
                            0,
                        );

                        // Compute the GST-inclusive face value — the amount the customer
                        // actually saves on their final bill (matches what was shown in cart).
                        // eligibleSellingPriceTotal is the GST-inclusive eligible cart total.
                        if (coupon.discountType === "percentage") {
                            couponFaceValue =
                                (eligibleSellingPriceTotal *
                                    coupon.discountValue) /
                                100;
                            if (coupon.maxDiscount) {
                                couponFaceValue = Math.min(
                                    couponFaceValue,
                                    coupon.maxDiscount,
                                );
                            }
                        } else if (coupon.discountType === "flat") {
                            couponFaceValue = Math.min(
                                coupon.discountValue,
                                eligibleSellingPriceTotal,
                            );
                        } else if (coupon.discountType === "free_shipping") {
                            couponFaceValue = 0;
                        }

                        // Back-calculate the pre-GST equivalent so that when GST is
                        // recalculated on the discounted base, the final total equals
                        // (eligibleSellingPriceTotal − couponFaceValue).
                        // Formula: cartDiscount = couponFaceValue × (preGstBase / gstInclusive)
                        cartDiscount =
                            eligibleSellingPriceTotal > 0
                                ? couponFaceValue *
                                  (eligibleSubtotal / eligibleSellingPriceTotal)
                                : 0;

                        couponInfo = {
                            code: coupon.code,
                            description: coupon.description,
                            discountType: coupon.discountType,
                            discountValue: coupon.discountValue,
                            discountApplied: couponFaceValue,
                        };
                    }
                } else {
                    warnings.push({
                        issue: `Coupon validation failed: ${validation.error}`,
                    });
                }
            }
        } catch (error) {
            logger.error("Error applying coupon:", error);
            warnings.push({
                issue: "Failed to apply coupon",
            });
        }
    }

    // Distribute discount proportionally across eligible items only
    // Pass couponFaceValue (GST-inclusive) — the function distributes in
    // GST-inclusive space to avoid ±0.01 pre-GST rounding errors.
    const eligibleItemsWithDiscount =
        couponFaceValue > 0
            ? pricing.distributeDiscountProportionally(
                  eligibleItems,
                  couponFaceValue,
              )
            : eligibleItems.map((item) => ({
                  ...item,
                  discountBase: 0,
                  taxableValue: item.baseAmount,
              }));

    // Merge back: eligible items get their discount, non-eligible items get 0 discount
    const itemsWithDiscount = items.map((item) => {
        const eligibleItem = eligibleItemsWithDiscount.find(
            (ei) =>
                ei.product._id.toString() === item.product._id.toString() &&
                ei.variant._id.toString() === item.variant._id.toString(),
        );

        if (eligibleItem) {
            return eligibleItem;
        }

        // Non-eligible items get no discount
        return {
            ...item,
            discountBase: 0,
            taxableValue: item.baseAmount,
        };
    });

    // Calculate GST on discounted amounts.
    // Round taxableValue first so item.total is consistent.
    itemsWithDiscount.forEach((item) => {
        const taxableBase = pricing.roundPrice(
            item.taxableValue ?? item.baseAmount,
        );
        item.taxableValue = taxableBase;
        const gstAmount = pricing.calculateGST(taxableBase, item.gstRate);
        item.gstAmount = pricing.roundPrice(gstAmount);
        item.total = pricing.roundPrice(taxableBase + gstAmount);
    });

    // Calculate cart-level pricing.
    // Derive discountedSubtotal from item taxableValues — more accurate than
    // itemsSubtotal − cartDiscount since it reflects the same rounding used per item.
    const discountedSubtotal = pricing.roundPrice(
        itemsWithDiscount.reduce((sum, item) => sum + item.taxableValue, 0),
    );

    // Calculate shipping charges (free if coupon provides free shipping)
    let shippingCharges = pricing.calculateShippingCharges(discountedSubtotal);
    if (couponInfo && couponInfo.discountType === "free_shipping") {
        shippingCharges = 0;
    }

    const taxableAmount = discountedSubtotal + shippingCharges;
    const gst = itemsWithDiscount.reduce(
        (sum, item) => sum + item.gstAmount,
        0,
    );
    // Derive total from rounded item totals to avoid re-summing pre-GST aggregates
    // which can introduce ±0.01 floating-point differences.
    const total = pricing.roundPrice(
        itemsWithDiscount.reduce((sum, item) => sum + item.total, 0) +
            shippingCharges,
    );

    const pricingSummary = {
        itemsSubtotal: pricing.roundPrice(itemsSubtotal),
        discount: pricing.roundPrice(couponFaceValue), // GST-inclusive face value
        discountedSubtotal: pricing.roundPrice(discountedSubtotal),
        shippingCharges: pricing.roundPrice(shippingCharges),
        taxableAmount: pricing.roundPrice(taxableAmount),
        gst: pricing.roundPrice(gst),
        total: pricing.roundPrice(total),
    };

    // Add coupon info if applied
    if (couponInfo) {
        pricingSummary.coupon = couponInfo;
    }

    return { items: itemsWithDiscount, pricing: pricingSummary, warnings };
};

// ============================================================================
// PLACE ORDER (COD)
// ============================================================================

/**
 * Place order with Cash on Delivery payment method
 * @param {String} userId - User ID
 * @param {Object} checkoutData - Checkout data
 * @returns {Promise<Object>} Created order
 */
const placeOrderCOD = async (userId, checkoutData) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Validate checkout data
        const validatedData = await initiateCheckout(userId, checkoutData);

        if (!validatedData.isValid) {
            throw new Error(
                "Cart validation failed: " +
                    JSON.stringify(validatedData.warnings),
            );
        }

        // 2. Prepare order data
        const orderItems = validatedData.items.map((item) => ({
            product: item.product._id,
            variant: item.variant._id,
            productName: item.product.name,
            variantName: item.variant.variantName,
            sku: item.variant.sku,
            image: item.variant.images?.[0] || item.product.images?.[0],
            quantity: item.quantity,
            weight: item.weight,
            metalValue: item.metalValue,
            makingCharges: item.makingCharges,
            gemstoneCharges: item.gemstoneCharges,
            sellingPrice: item.sellingPrice,
            baseAmount: item.baseAmount,
            discountBase: item.discountBase,
            taxableValue: item.taxableValue,
            gstRate: item.gstRate,
            gstAmount: item.gstAmount,
            total: item.total,
        }));

        const orderData = {
            customer: userId,
            items: orderItems,
            shippingAddress: validatedData.addresses.shipping,
            billingAddress: validatedData.addresses.billing,
            pricing: validatedData.pricing,
            payment: {
                method: "cod",
                status: "pending",
            },
            orderStatus: "confirmed", // COD orders are confirmed immediately
            statusHistory: [{ status: "confirmed", timestamp: new Date() }],
            customerNote: validatedData.customerNote,
        };

        // Add coupon snapshot if applied
        if (validatedData.pricing.coupon) {
            orderData.appliedCoupon = {
                code: validatedData.pricing.coupon.code,
                description: validatedData.pricing.coupon.description,
                discountType: validatedData.pricing.coupon.discountType,
                discountValue: validatedData.pricing.coupon.discountValue,
                discountAmount: validatedData.pricing.coupon.discountApplied,
            };
        }

        // 3. Create order
        const order = await orderService.createOrder(orderData, session);

        // 4. Reduce stock
        await orderService.reduceStock(orderItems, session);

        // 5. Clear cart
        await Cart.findOneAndUpdate({ userId }, { items: [] }, { session });

        await session.commitTransaction();

        // 6. Increment coupon usage after commit (non-transactional by design)
        if (validatedData.pricing.coupon) {
            await couponService.incrementCouponUsage(
                validatedData.pricing.coupon.code,
                userId,
                order._id,
                validatedData.pricing.coupon.discountApplied,
                validatedData.pricing.itemsSubtotal,
            );
        }

        logger.info(
            `COD Order created: ${order.orderNumber} for user ${userId}`,
        );

        return order;
    } catch (error) {
        await session.abortTransaction();
        logger.error(`Error placing COD order: ${error.message}`);
        throw error;
    } finally {
        session.endSession();
    }
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Filter cart items eligible for coupon discount
 * Applies category, product, and exclusion filters
 */
const filterEligibleItems = (items, coupon) => {
    return items.filter((item) => {
        const productId = item.product._id.toString();

        // Check if product is explicitly excluded
        if (
            coupon.excludedProducts &&
            coupon.excludedProducts.length > 0 &&
            coupon.excludedProducts.some((id) => id.toString() === productId)
        ) {
            return false;
        }

        // If specific products are listed, item must be in that list
        if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
            return coupon.applicableProducts.some(
                (id) => id.toString() === productId,
            );
        }

        // If specific categories are listed, item must be in one of those categories
        if (
            coupon.applicableCategories &&
            coupon.applicableCategories.length > 0
        ) {
            const productCategoryId = item.product.category?.toString();
            const productSubcategoryId = item.product.subcategory?.toString();
            return coupon.applicableCategories.some((catId) => {
                const catStr = catId.toString();
                return (
                    (productCategoryId && catStr === productCategoryId) ||
                    (productSubcategoryId && catStr === productSubcategoryId)
                );
            });
        }

        // If no restrictions, all items are eligible
        return true;
    });
};

/**
 * Validate COD eligibility
 * @param {String} userId - User ID
 * @param {Number} orderSubtotal - Order subtotal (base amount before shipping/GST)
 * @returns {Promise<Object>} Validation result
 */
const validateCODEligibility = async (userId, orderSubtotal) => {
    // Rule 1: Max order value (check on base amount, not final total)
    if (orderSubtotal > pricing.COD_MAX_ORDER_VALUE) {
        return {
            allowed: false,
            reason: `COD not available for orders above ₹${pricing.COD_MAX_ORDER_VALUE.toLocaleString()}`,
        };
    }

    // Rule 2: Check failed COD delivery history (future enhancement)
    // const failedCODCount = await Order.countDocuments({
    //     customer: userId,
    //     'payment.method': 'cod',
    //     orderStatus: 'cancelled',
    //     'statusHistory.note': /customer.*refused|unavailable/i
    // });
    // if (failedCODCount >= 3) {
    //     return {
    //         allowed: false,
    //         reason: 'COD not available due to past failed deliveries'
    //     };
    // }

    return { allowed: true };
};

// ============================================================================
// EXPORTS
// ============================================================================

export { initiateCheckout, placeOrderCOD, calculateCheckoutPricing };
