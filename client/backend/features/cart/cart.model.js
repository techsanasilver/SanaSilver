import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductVariant",
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, "Quantity must be at least 1"],
            default: 1,
        },
        addedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false },
);

const cartSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        items: [cartItemSchema],
        lastActivityAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    },
);

// Update lastActivityAt on every save
cartSchema.pre("save", function (next) {
    this.lastActivityAt = new Date();
    next();
});

// Indexes
cartSchema.index({ userId: 1 }, { unique: true });
cartSchema.index({ updatedAt: 1 }); // For cleanup of old carts

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
