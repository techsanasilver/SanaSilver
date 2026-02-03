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
                "Variant SKU must follow format: SS-CATEGORY-NAME-NUMBER-VARIANT (e.g., SS-RING-LOTUS-001-S7 or SS-RING-LOTUS-001-V1)",
            ],
        },
        variantName: {
            type: String,
            required: [true, "Variant name is required"],
            trim: true,
        },
        attributes: [
            {
                key: {
                    type: String,
                    required: true,
                    trim: true,
                },
                value: {
                    type: String,
                    required: true,
                    trim: true,
                },
                _id: false, // Don't create _id for subdocuments
            },
        ],
        weight: {
            type: Number,
            required: [true, "Weight is required"],
            min: [0.01, "Weight must be greater than 0"],
        },
        dimensions: {
            length: {
                type: Number,
                min: [0, "Length cannot be negative"],
            },
            width: {
                type: Number,
                min: [0, "Width cannot be negative"],
            },
            height: {
                type: Number,
                min: [0, "Height cannot be negative"],
            },
        },
        mrp: {
            type: Number,
            min: [0, "MRP cannot be negative"],
        },
        sellingPrice: {
            type: Number,
            required: [true, "Selling price is required"],
            min: [0, "Selling price cannot be negative"],
        },
        costPrice: {
            type: Number,
            min: [0, "Cost price cannot be negative"],
        },
        priceBreakdown: {
            metalRate: {
                type: Number,
                min: [0, "Metal rate cannot be negative"],
            },
            weight: {
                type: Number,
                min: [0, "Weight cannot be negative"],
            },
            metalValue: {
                type: Number,
                min: [0, "Metal value cannot be negative"],
            },
            makingChargesPerGram: {
                type: Number,
                min: [0, "Making charges per gram cannot be negative"],
            },
            makingCharges: {
                type: Number,
                min: [0, "Making charges cannot be negative"],
            },
            gemstoneCharges: {
                type: Number,
                min: [0, "Gemstone charges cannot be negative"],
            },
            subtotal: {
                type: Number,
                min: [0, "Subtotal cannot be negative"],
            },
            gstRate: {
                type: Number,
                min: [0, "GST rate cannot be negative"],
            },
            gstAmount: {
                type: Number,
                min: [0, "GST amount cannot be negative"],
            },
            calculatedTotal: {
                type: Number,
                min: [0, "Calculated total cannot be negative"],
            },
            beautifiedPrice: {
                type: Number,
                min: [0, "Beautified price cannot be negative"],
            },
            calculatedAt: {
                type: Date,
            },
        },
        stockQuantity: {
            type: Number,
            default: 0,
            min: [0, "Stock quantity cannot be negative"],
        },
        lowStockThreshold: {
            type: Number,
            default: 5,
            min: [0, "Low stock threshold cannot be negative"],
        },
        images: {
            type: [
                {
                    publicId: {
                        type: String,
                        required: true,
                    },
                    url: {
                        type: String,
                    },
                    alt: {
                        type: String,
                        default: "",
                    },
                    sortOrder: {
                        type: Number,
                        default: 0,
                    },
                    isPrimary: {
                        type: Boolean,
                        default: false,
                    },
                    _id: false,
                },
            ],
            default: [],
        },
        sortOrder: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastPriceUpdate: {
            type: Date,
            default: Date.now,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            required: [true, "Created by admin is required"],
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

// ===== VIRTUALS =====

// Check if in stock
productVariantSchema.virtual("inStock").get(function () {
    return this.stockQuantity > 0;
});

// Check if low stock
productVariantSchema.virtual("lowStock").get(function () {
    return (
        this.stockQuantity > 0 && this.stockQuantity <= this.lowStockThreshold
    );
});

// Stock status
productVariantSchema.virtual("stockStatus").get(function () {
    if (this.stockQuantity === 0) return "out_of_stock";
    if (this.stockQuantity <= this.lowStockThreshold) return "low_stock";
    return "in_stock";
});

// Discount percentage
productVariantSchema.virtual("discountPercent").get(function () {
    if (!this.mrp || this.mrp <= this.sellingPrice) return 0;
    return Math.round(((this.mrp - this.sellingPrice) / this.mrp) * 100);
});

// Discount amount
productVariantSchema.virtual("discountAmount").get(function () {
    if (!this.mrp || this.mrp <= this.sellingPrice) return 0;
    return this.mrp - this.sellingPrice;
});

// Has active discount
productVariantSchema.virtual("hasDiscount").get(function () {
    return this.mrp && this.mrp > this.sellingPrice;
});

// Effective price (for future coupon/flash sale logic)
productVariantSchema.virtual("effectivePrice").get(function () {
    // Future: Check for time-limited discounts, apply coupons
    // For now, just return selling price
    return this.sellingPrice;
});

// Profit margin (admin analytics)
productVariantSchema.virtual("profitMargin").get(function () {
    if (!this.costPrice || this.costPrice === 0) return null;
    return Math.round(
        ((this.sellingPrice - this.costPrice) / this.costPrice) * 100,
    );
});

// ===== HELPER METHODS =====

// Get specific attribute value
productVariantSchema.methods.getAttributeValue = function (key) {
    const attr = this.attributes.find(
        (a) => a.key.toLowerCase() === key.toLowerCase(),
    );
    return attr ? attr.value : null;
};

// Check if has attribute
productVariantSchema.methods.hasAttribute = function (key) {
    return this.attributes.some(
        (a) => a.key.toLowerCase() === key.toLowerCase(),
    );
};

// ===== PRE-SAVE MIDDLEWARE =====

productVariantSchema.pre("save", async function (next) {
    // Validate MRP is greater than or equal to selling price
    if (this.mrp && this.mrp < this.sellingPrice) {
        return next(new Error("MRP cannot be less than selling price"));
    }

    // Ensure SKU is set
    if (!this.sku && this.product) {
        // This will be handled by the service layer which has access to Product data
        // Here we just ensure it's set
        if (!this.sku) {
            return next(new Error("SKU is required"));
        }
    }

    next();
});

// ===== INDEXES =====
// Note: sku already indexed via unique: true
productVariantSchema.index({ product: 1 });
productVariantSchema.index({ sellingPrice: 1 });
productVariantSchema.index({ stockQuantity: 1 });
productVariantSchema.index({ isActive: 1 });
productVariantSchema.index({ product: 1, isActive: 1 });
productVariantSchema.index({ product: 1, sortOrder: 1 });
productVariantSchema.index({ "attributes.key": 1, "attributes.value": 1 });
productVariantSchema.index({ "images.publicId": 1 }); // For image lookups

// Compound index for filtering
productVariantSchema.index({
    product: 1,
    "attributes.key": 1,
    "attributes.value": 1,
});

const ProductVariant = mongoose.model("ProductVariant", productVariantSchema);

export default ProductVariant;
