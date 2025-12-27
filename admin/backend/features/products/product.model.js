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
        sku: {
            type: String,
            required: [true, "SKU is required"],
            unique: true,
            uppercase: true,
            trim: true,
            match: [
                /^SS-[A-Z0-9]+-[A-Z0-9]+-\d{3,}$/,
                "SKU must follow format: SS-CATEGORY-NAME-NUMBER (e.g., SS-RING-LOTUS-001)",
            ],
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
        weight: {
            type: Number,
            required: [true, "Weight is required"],
            min: [0, "Weight cannot be negative"],
        },
        makingCharges: {
            type: Number,
            default: 0,
            min: [0, "Making charges cannot be negative"],
        },
        makingChargesType: {
            type: String,
            enum: ["fixed", "percentage", "per-gram"],
            default: "fixed",
        },
        gstRate: {
            type: Number,
            default: 3,
            min: [0, "GST rate cannot be negative"],
        },
        images: {
            type: [String],
            required: [true, "At least one image is required"],
            validate: {
                validator: function (array) {
                    return array.length > 0;
                },
                message: "Product must have at least one image",
            },
        },
        variants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "ProductVariant",
            },
        ],
        basePrice: {
            type: Number,
            required: [true, "Base price is required"],
            min: [0, "Base price cannot be negative"],
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
                enum: ["men", "women", "unisex"],
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
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
productSchema.index({ slug: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ collections: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ "ratings.average": -1 });
productSchema.index({ createdAt: -1 });

const Product = mongoose.model("Product", productSchema);

export default Product;
