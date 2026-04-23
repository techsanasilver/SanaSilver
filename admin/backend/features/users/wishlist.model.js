import mongoose from "mongoose";

/**
 * Read-only mirror of the Wishlist collection shared with client backend.
 * Admin only reads this — never writes.
 */

const wishlistItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
        },
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductVariant",
        },
        addedAt: { type: Date },
    },
    { _id: true },
);

const wishlistSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        items: [wishlistItemSchema],
    },
    { timestamps: true },
);

const Wishlist = mongoose.model("Wishlist", wishlistSchema);

export default Wishlist;
