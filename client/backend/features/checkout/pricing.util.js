// ============================================================================
// PRICING CONSTANTS
// ============================================================================

export const GST_RATE = 3; // 3% for jewelry
export const FREE_SHIPPING_THRESHOLD = 0; // Free shipping on all orders
export const FLAT_SHIPPING_CHARGE = 0; // No shipping charge
export const COD_MAX_ORDER_VALUE = 50000; // COD not available above ₹50,000
export const CURRENT_SILVER_RATE_PER_GRAM = 80; // Example: ₹80/gram (in production, fetch from rate service)

// ============================================================================
// METAL VALUE CALCULATION
// ============================================================================

/**
 * Calculate metal value based on weight and purity
 * NOTE: Product variants have pre-calculated priceBreakdown values.
 * These calculation functions are kept as fallbacks for cases where
 * priceBreakdown might not be available or for admin price calculations.
 *
 * @param {Number} weight - Weight in grams
 * @param {String} purity - "925" or "999"
 * @param {Number} silverRatePerGram - Current silver rate per gram
 * @returns {Number} Metal value
 */
export const calculateMetalValue = (weight, purity, silverRatePerGram) => {
    const purityMultiplier = purity === "999" ? 1 : 0.925;
    return weight * silverRatePerGram * purityMultiplier;
};

// ============================================================================
// MAKING CHARGES CALCULATION
// ============================================================================

/**
 * Calculate making charges
 * @param {Number} weight - Weight in grams
 * @param {Number} makingChargesPerGram - Making charges per gram
 * @returns {Number} Making charges
 */
export const calculateMakingCharges = (weight, makingChargesPerGram) => {
    return weight * makingChargesPerGram;
};

// ============================================================================
// SUBTOTAL CALCULATION
// ============================================================================

/**
 * Calculate item subtotal (before discount and GST)
 * @param {Number} metalValue - Metal value
 * @param {Number} makingCharges - Making charges
 * @param {Number} gemstoneCharges - Gemstone charges (if any)
 * @returns {Number} Subtotal
 */
export const calculateItemSubtotal = (
    metalValue,
    makingCharges,
    gemstoneCharges = 0,
) => {
    return metalValue + makingCharges + gemstoneCharges;
};

// ============================================================================
// GST CALCULATION
// ============================================================================

/**
 * Calculate GST amount
 * @param {Number} taxableAmount - Amount on which GST is calculated
 * @param {Number} gstRate - GST rate (default 3%)
 * @returns {Number} GST amount
 */
export const calculateGST = (taxableAmount, gstRate = GST_RATE) => {
    return (taxableAmount * gstRate) / 100;
};

/**
 * Calculate tax split (CGST+SGST for intrastate, IGST for interstate)
 * @param {Number} gstAmount - Total GST amount
 * @param {String} sellerState - Seller's state
 * @param {String} buyerState - Buyer's state
 * @returns {Object} Tax split { cgst, sgst, igst }
 */
export const calculateTaxSplit = (gstAmount, sellerState, buyerState) => {
    // Intrastate: CGST + SGST (split equally)
    if (sellerState === buyerState) {
        return {
            cgst: gstAmount / 2,
            sgst: gstAmount / 2,
            igst: 0,
        };
    }

    // Interstate: IGST only
    return {
        cgst: 0,
        sgst: 0,
        igst: gstAmount,
    };
};

// ============================================================================
// SHIPPING CALCULATION
// ============================================================================

/**
 * Calculate shipping charges based on cart subtotal
 * @param {Number} cartSubtotal - Cart subtotal after discount
 * @returns {Number} Shipping charges
 */
export const calculateShippingCharges = (cartSubtotal) => {
    if (cartSubtotal >= FREE_SHIPPING_THRESHOLD) {
        return 0; // Free shipping
    }
    return FLAT_SHIPPING_CHARGE;
};

// ============================================================================
// DISCOUNT CALCULATION
// ============================================================================

/**
 * Calculate discount amount based on coupon
 * @param {Number} subtotal - Cart subtotal
 * @param {Object} coupon - Coupon object { discountType, discountValue, maxDiscount }
 * @returns {Number} Discount amount
 */
export const calculateDiscount = (subtotal, coupon) => {
    if (!coupon) return 0;

    if (coupon.discountType === "flat" || coupon.discountType === "fixed") {
        return Math.min(coupon.discountValue, subtotal);
    }

    if (coupon.discountType === "percentage") {
        const discountAmount = (subtotal * coupon.discountValue) / 100;

        // Apply max discount cap if exists
        if (coupon.maxDiscount) {
            return Math.min(discountAmount, coupon.maxDiscount);
        }

        return discountAmount;
    }

    return 0;
};

/**
 * Distribute coupon discount proportionally across items in GST-inclusive space.
 * Distributing in pre-GST space causes ±0.01 errors because rounding the last
 * item's unrounded remainder in pre-GST then re-applying GST drifts the total.
 * Distributing the GST-inclusive face value directly ensures each item's total
 * is exact: total = sellingPrice × qty − faceDiscount, taxableValue is
 * back-calculated so there is no re-aggregation error.
 *
 * @param {Array} items - Eligible cart items (must have sellingPrice, quantity, baseAmount, gstRate)
 * @param {Number} couponFaceValue - GST-inclusive discount total to distribute
 * @returns {Array} Items with discountBase, taxableValue set
 */
export const distributeDiscountProportionally = (items, couponFaceValue) => {
    if (couponFaceValue === 0) {
        return items.map((item) => ({
            ...item,
            discountBase: 0,
            taxableValue: item.baseAmount,
        }));
    }

    const totalSellingPrice = items.reduce(
        (sum, item) => sum + (item.sellingPrice || 0) * item.quantity,
        0,
    );
    let allocatedFaceDiscount = 0;

    return items.map((item, index) => {
        const itemSellingTotal = (item.sellingPrice || 0) * item.quantity;
        let itemFaceDiscount;

        if (index === items.length - 1) {
            // Last item absorbs the remainder — keeps sum exact
            itemFaceDiscount = couponFaceValue - allocatedFaceDiscount;
        } else {
            itemFaceDiscount =
                (couponFaceValue * itemSellingTotal) / totalSellingPrice;
            itemFaceDiscount = roundPrice(itemFaceDiscount);
            allocatedFaceDiscount += itemFaceDiscount;
        }

        // Total is derived directly from the GST-inclusive price minus face discount
        const itemTotal = roundPrice(itemSellingTotal - itemFaceDiscount);
        // Back-calculate pre-GST taxable value from the GST-inclusive total
        const taxableValue = roundPrice(itemTotal / (1 + item.gstRate / 100));
        const discountBase = roundPrice(item.baseAmount - taxableValue);

        return {
            ...item,
            discountBase,
            taxableValue,
        };
    });
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Round price to 2 decimal places
 * @param {Number} amount - Amount to round
 * @returns {Number} Rounded amount
 */
export const roundPrice = (amount) => {
    return Math.round(amount * 100) / 100;
};

/**
 * Format price for display (e.g., 1234.56 -> "₹1,234.56")
 * @param {Number} amount - Amount to format
 * @returns {String} Formatted price
 */
export const formatPrice = (amount) => {
    return `₹${amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

/**
 * Calculate final total
 * @param {Number} subtotal - Items subtotal
 * @param {Number} discount - Total discount
 * @param {Number} shippingCharges - Shipping charges
 * @param {Number} gst - Total GST
 * @returns {Object} Pricing breakdown
 */
export const calculateFinalTotal = (
    subtotal,
    discount,
    shippingCharges,
    gst,
) => {
    const discountedSubtotal = subtotal - discount;
    const taxableAmount = discountedSubtotal + shippingCharges;
    const total = taxableAmount + gst;

    return {
        itemsSubtotal: roundPrice(subtotal),
        discount: roundPrice(discount),
        discountedSubtotal: roundPrice(discountedSubtotal),
        shippingCharges: roundPrice(shippingCharges),
        taxableAmount: roundPrice(taxableAmount),
        gst: roundPrice(gst),
        total: roundPrice(total),
    };
};
