import mongoose from "mongoose";

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
        pricePerUnit: {
            type: Number,
            required: [true, "Price per unit is required"],
            min: [0, "Price cannot be negative"],
        },
        makingCharges: {
            type: Number,
            default: 0,
            min: [0, "Making charges cannot be negative"],
        },
        gst: {
            type: Number,
            default: 0,
            min: [0, "GST cannot be negative"],
        },
        subtotal: {
            type: Number,
            required: [true, "Subtotal is required"],
            min: [0, "Subtotal cannot be negative"],
        },
    },
    { _id: true }
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
    { _id: false }
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
    { _id: true }
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
            subtotal: {
                type: Number,
                required: true,
                min: [0, "Subtotal cannot be negative"],
            },
            shippingCharges: {
                type: Number,
                default: 0,
                min: [0, "Shipping charges cannot be negative"],
            },
            discount: {
                type: Number,
                default: 0,
                min: [0, "Discount cannot be negative"],
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
        payment: {
            method: {
                type: String,
                enum: ["razorpay", "cod", "bank-transfer"],
                required: [true, "Payment method is required"],
            },
            status: {
                type: String,
                enum: ["pending", "paid", "failed", "refunded"],
                default: "pending",
            },
            razorpayOrderId: {
                type: String,
            },
            razorpayPaymentId: {
                type: String,
            },
            razorpaySignature: {
                type: String,
            },
            paidAt: {
                type: Date,
            },
        },
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
        statusHistory: {
            type: [statusHistorySchema],
            default: [],
        },
        tracking: {
            courier: {
                type: String,
            },
            trackingNumber: {
                type: String,
            },
            shippedAt: {
                type: Date,
            },
            deliveredAt: {
                type: Date,
            },
        },
        notes: {
            type: String,
        },
        customerNote: {
            type: String,
        },
        couponCode: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ "payment.status": 1 });
orderSchema.index({ createdAt: -1 });

// Auto-generate order number
orderSchema.pre("save", async function (next) {
    if (!this.orderNumber) {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
        const count = await mongoose.model("Order").countDocuments({
            createdAt: {
                $gte: new Date(date.setHours(0, 0, 0, 0)),
            },
        });
        this.orderNumber = `ORD-${dateStr}-${String(count + 1).padStart(
            4,
            "0"
        )}`;
    }
    next();
});

// Add status to history when order status changes
orderSchema.pre("save", function (next) {
    if (this.isModified("orderStatus")) {
        this.statusHistory.push({
            status: this.orderStatus,
            timestamp: new Date(),
        });
    }
    next();
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
