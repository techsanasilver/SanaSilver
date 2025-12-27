import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product reference is required"],
        },
        sku: {
            type: String,
            required: [true, "Variant SKU is required"],
            unique: true,
            uppercase: true,
            trim: true,
            match: [
                /^SS-[A-Z0-9]+-[A-Z0-9]+-\d{3,}-.+$/,
                "Variant SKU must follow format: SS-CATEGORY-NAME-NUMBER-VARIANT (e.g., SS-RING-LOTUS-001-S7)",
            ],
        },
        variantName: {
            type: String,
            required: [true, "Variant name is required"],
            trim: true,
        },
        size: {
            type: String,
            trim: true,
        },
        color: {
            type: String,
            trim: true,
        },
        length: {
            type: String,
            trim: true,
        },
        plating: {
            type: String,
            trim: true,
        },
        weight: {
            type: Number,
            min: [0, "Weight cannot be negative"],
        },
        additionalPrice: {
            type: Number,
            default: 0,
            min: [0, "Additional price cannot be negative"],
        },
        sellingPrice: {
            type: Number,
            required: [true, "Selling price is required"],
            min: [0, "Selling price cannot be negative"],
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
        stockQuantity: {
            type: Number,
            default: 0,
            min: [0, "Stock quantity cannot be negative"],
        },
        stockStatus: {
            type: String,
            enum: ["in-stock", "low-stock", "out-of-stock"],
            default: "in-stock",
        },
        lowStockThreshold: {
            type: Number,
            default: 5,
            min: [0, "Low stock threshold cannot be negative"],
        },
        image: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
productVariantSchema.index({ product: 1, isActive: 1 });
productVariantSchema.index({ product: 1, isDefault: 1 });
productVariantSchema.index({ sku: 1 });
productVariantSchema.index({ stockQuantity: 1 });

// Ensure only one default variant per product
productVariantSchema.index(
    { product: 1, isDefault: 1 },
    {
        unique: true,
        partialFilterExpression: { isDefault: true },
    }
);

// Update stock status based on quantity
productVariantSchema.pre("save", function (next) {
    if (this.stockQuantity === 0) {
        this.stockStatus = "out-of-stock";
    } else if (this.stockQuantity <= this.lowStockThreshold) {
        this.stockStatus = "low-stock";
    } else {
        this.stockStatus = "in-stock";
    }
    next();
});

const ProductVariant = mongoose.model("ProductVariant", productVariantSchema);

export default ProductVariant;
