import mongoose from "mongoose";

// ============================================================================
// COUNTER SCHEMA (atomic order number generation)
// ============================================================================

const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

// ============================================================================
// SUB-SCHEMAS
// ============================================================================

const orderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        variant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductVariant",
            required: [true, "Product variant is required"],
        },
        productName: {
            type: String,
            required: true,
        },
        variantName: {
            type: String,
        },
        sku: {
            type: String,
            required: true,
        },
        image: {
            type: String,
        },
        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [1, "Quantity must be at least 1"],
        },
        weight: {
            type: Number,
            min: [0, "Weight cannot be negative"],
        },
        metalValue: {
            type: Number,
            default: 0,
            min: [0, "Metal value cannot be negative"],
        },
        makingCharges: {
            type: Number,
            default: 0,
            min: [0, "Making charges cannot be negative"],
        },
        gemstoneCharges: {
            type: Number,
            default: 0,
            min: [0, "Gemstone charges cannot be negative"],
        },
        // GST-inclusive selling price per unit (what the customer saw)
        sellingPrice: {
            type: Number,
            min: [0, "Selling price cannot be negative"],
        },
        // Pre-GST base price for this line
        baseAmount: {
            type: Number,
            required: [true, "Base amount is required"],
            min: [0, "Base amount cannot be negative"],
        },
        // Pre-GST discount allocated to this item (internal)
        discountBase: {
            type: Number,
            default: 0,
            min: [0, "Discount cannot be negative"],
        },
        // Pre-GST taxable value after discount (GST applied on this)
        taxableValue: {
            type: Number,
            min: [0, "Taxable value cannot be negative"],
        },
        gstRate: {
            type: Number,
            default: 0,
            min: [0, "GST rate cannot be negative"],
        },
        gstAmount: {
            type: Number,
            default: 0,
            min: [0, "GST cannot be negative"],
        },
        // Final item total paid by customer (= taxableValue + gstAmount)
        total: {
            type: Number,
            required: [true, "Total is required"],
            min: [0, "Total cannot be negative"],
        },
    },
    { _id: true },
);

const addressSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        line1: {
            type: String,
            required: true,
        },
        line2: {
            type: String,
        },
        city: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        pincode: {
            type: String,
            required: true,
        },
        country: {
            type: String,
            default: "India",
        },
    },
    { _id: false },
);

const statusHistorySchema = new mongoose.Schema(
    {
        status: {
            type: String,
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
        note: {
            type: String,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
        },
    },
    { _id: true },
);

const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true,
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Customer is required"],
        },
        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: function (array) {
                    return array.length > 0;
                },
                message: "Order must have at least one item",
            },
        },
        shippingAddress: {
            type: addressSchema,
            required: [true, "Shipping address is required"],
        },
        billingAddress: {
            type: addressSchema,
            required: [true, "Billing address is required"],
        },
        pricing: {
            itemsSubtotal: {
                type: Number,
                required: true,
                min: [0, "Subtotal cannot be negative"],
            },
            discount: {
                type: Number,
                default: 0,
                min: [0, "Discount cannot be negative"],
            },
            discountedSubtotal: {
                type: Number,
                min: [0, "Discounted subtotal cannot be negative"],
            },
            shippingCharges: {
                type: Number,
                default: 0,
                min: [0, "Shipping charges cannot be negative"],
            },
            taxableAmount: {
                type: Number,
                min: [0, "Taxable amount cannot be negative"],
            },
            gst: {
                type: Number,
                required: true,
                min: [0, "GST cannot be negative"],
            },
            total: {
                type: Number,
                required: true,
                min: [0, "Total cannot be negative"],
            },
        },
        // Tax split (for invoice — CGST+SGST intrastate, IGST interstate)
        taxSplit: {
            cgst: { type: Number, min: 0 },
            sgst: { type: Number, min: 0 },
            igst: { type: Number, min: 0 },
        },

        // Applied coupon (snapshot at order creation)
        appliedCoupon: {
            code: { type: String, uppercase: true },
            description: { type: String },
            discountType: {
                type: String,
                enum: ["percentage", "flat", "free_shipping"],
            },
            discountValue: { type: Number, min: 0 },
            discountAmount: { type: Number, min: 0 },
        },

        // Payment details
        payment: {
            method: {
                type: String,
                enum: ["razorpay", "cod", "wallet"],
                required: [true, "Payment method is required"],
            },
            status: {
                type: String,
                enum: ["pending", "paid", "failed", "refunded"],
                default: "pending",
            },
            razorpayOrderId: { type: String },
            razorpayPaymentId: { type: String },
            razorpaySignature: { type: String },
            paidAt: { type: Date },
        },

        // Order status
        orderStatus: {
            type: String,
            enum: [
                "pending",
                "confirmed",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
            ],
            default: "pending",
        },

        // Status history timeline
        statusHistory: {
            type: [statusHistorySchema],
            default: [],
        },

        // Shipping/Tracking
        tracking: {
            courier: { type: String },
            trackingNumber: { type: String },
            shippedAt: { type: Date },
            estimatedDelivery: { type: Date },
            deliveredAt: { type: Date },
        },

        // Notes
        notes: { type: String }, // Admin notes
        customerNote: { type: String }, // Customer's special instructions
    },
    {
        timestamps: true,
    },
);

// ============================================================================
// INDEXES
// ============================================================================

// orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ "payment.status": 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "appliedCoupon.code": 1 }, { sparse: true });

// ============================================================================
// PRE-VALIDATE HOOK (order number generation — atomic, race-condition safe)
// ============================================================================

/**
 * Auto-generate order number BEFORE validation.
 * Uses pre('validate') so the generated value is available when Mongoose
 * runs required-field checks. Uses an atomic counter to avoid duplicates.
 * Admin never creates orders, so this hook is a no-op in practice.
 */
orderSchema.pre("validate", async function () {
    if (!this.orderNumber) {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");

        const counter = await Counter.findOneAndUpdate(
            { _id: `orders-${dateStr}` },
            { $inc: { seq: 1 } },
            { new: true, upsert: true },
        );

        this.orderNumber = `ORD-${dateStr}-${String(counter.seq).padStart(4, "0")}`;
    }
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

orderSchema.methods.canBeCancelled = function () {
    const cancellableStatuses = ["pending", "confirmed"];
    return cancellableStatuses.includes(this.orderStatus);
};

orderSchema.methods.canBeReturned = function () {
    if (this.orderStatus !== "delivered") return false;
    const deliveryDate = this.tracking?.deliveredAt;
    if (!deliveryDate) return false;
    const daysSinceDelivery = Math.floor(
        (Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysSinceDelivery <= 7;
};

orderSchema.methods.getCurrentStatus = function () {
    if (this.statusHistory.length === 0) {
        return { status: this.orderStatus, timestamp: this.createdAt };
    }
    return this.statusHistory[this.statusHistory.length - 1];
};

// ============================================================================
// EXPORT MODEL
// ============================================================================

const Order = mongoose.model("Order", orderSchema);

export default Order;
