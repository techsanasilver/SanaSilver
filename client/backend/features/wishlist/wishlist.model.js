import mongoose from "mongoose";

const wishlistItemSchema = new mongoose.Schema(
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
        addedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true },
);

const wishlistSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        items: [wishlistItemSchema],
    },
    {
        timestamps: true,
    },
);

// Create unique index on userId
wishlistSchema.index({ userId: 1 }, { unique: true });

// Create compound index for faster lookups
wishlistSchema.index({ "items.productId": 1, "items.variantId": 1 });

const Wishlist = mongoose.model("Wishlist", wishlistSchema);

export default Wishlist;
