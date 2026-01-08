import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
        },
        slug: {
            type: String,
            required: [true, "Product slug is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        shortDescription: {
            type: String,
            trim: true,
            maxlength: [500, "Short description cannot exceed 500 characters"],
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: [true, "Category is required"],
        },
        subcategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
        },
        collections: {
            type: [String],
            default: [],
        },
        purity: {
            type: String,
            enum: ["925", "999"],
            required: [true, "Purity is required"],
        },
        makingChargesPerGram: {
            type: Number,
            required: [true, "Making charges per gram are required"],
            min: [0, "Making charges cannot be negative"],
        },
        gstRate: {
            type: Number,
            required: [true, "GST rate is required"],
            min: [0, "GST rate cannot be negative"],
            max: [100, "GST rate cannot exceed 100%"],
            default: 3,
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
            required: [true, "At least one image is required"],
            validate: {
                validator: function (array) {
                    return array.length > 0;
                },
                message: "Product must have at least one image",
            },
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        tags: {
            type: [String],
            default: [],
        },
        hallmark: {
            isHallmarked: {
                type: Boolean,
                default: false,
            },
            bisLicenseNumber: {
                type: String,
            },
            hallmarkingCenter: {
                type: String,
            },
            purityCertified: {
                type: String,
                enum: ["925", "999", ""],
                default: "",
            },
        },
        attributes: {
            gemstone: {
                type: String,
            },
            occasion: {
                type: String,
            },
            gender: {
                type: String,
                enum: ["men", "women", "unisex", ""],
                default: "",
            },
            plating: {
                type: String,
            },
        },
        seo: {
            metaTitle: {
                type: String,
            },
            metaDescription: {
                type: String,
            },
            metaKeywords: {
                type: [String],
                default: [],
            },
        },
        ratings: {
            average: {
                type: Number,
                default: 0,
                min: [0, "Rating cannot be negative"],
                max: [5, "Rating cannot exceed 5"],
            },
            count: {
                type: Number,
                default: 0,
                min: [0, "Rating count cannot be negative"],
            },
        },
        viewCount: {
            type: Number,
            default: 0,
            min: [0, "View count cannot be negative"],
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
    }
);

// Virtual to get all variants for this product
productSchema.virtual("variants", {
    ref: "ProductVariant",
    localField: "_id",
    foreignField: "product",
});

// Virtual to get minimum variant price
productSchema.virtual("minPrice").get(function () {
    if (this.variantsData && this.variantsData.length > 0) {
        return Math.min(...this.variantsData.map((v) => v.sellingPrice));
    }
    return null;
});

// Virtual to get maximum variant price
productSchema.virtual("maxPrice").get(function () {
    if (this.variantsData && this.variantsData.length > 0) {
        return Math.max(...this.variantsData.map((v) => v.sellingPrice));
    }
    return null;
});

// Virtual to get total stock across all variants
productSchema.virtual("totalStock").get(function () {
    if (this.variantsData && this.variantsData.length > 0) {
        return this.variantsData.reduce(
            (sum, v) => sum + (v.stockQuantity || 0),
            0
        );
    }
    return 0;
});

// Indexes for faster queries
// Note: slug already indexed via unique: true
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ collections: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ "ratings.average": -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: "text", description: "text" }); // Full-text search

const Product = mongoose.model("Product", productSchema);

export default Product;
