import mongoose from "mongoose";

/**
 * Read-only mirror of the Cart collection shared with client backend.
 * Admin only reads this — never writes.
 */

const cartItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
        },
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductVariant",
        },
        quantity: { type: Number },
        addedAt: { type: Date },
    },
    { _id: false },
);

const cartSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        items: [cartItemSchema],
        lastActivityAt: { type: Date },
    },
    { timestamps: true },
);

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
