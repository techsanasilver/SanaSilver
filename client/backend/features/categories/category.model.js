import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            trim: true,
            maxlength: [100, "Category name cannot exceed 100 characters"],
        },
        slug: {
            type: String,
            // unique: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, "Description cannot exceed 500 characters"],
        },
        image: {
            publicId: {
                type: String,
            },
            alt: {
                type: String,
            },
        },
        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null,
        },
        level: {
            type: Number,
            default: 0,
            min: 0,
            max: 3,
        },
        sortOrder: {
            type: Number,
            default: 0,
            min: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        metaTitle: {
            type: String,
            maxlength: [60, "Meta title cannot exceed 60 characters"],
        },
        metaDescription: {
            type: String,
            maxlength: [160, "Meta description cannot exceed 160 characters"],
        },
        metaKeywords: {
            type: [String],
            default: [],
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            required: true,
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

// Virtual for children categories
categorySchema.virtual("children", {
    ref: "Category",
    localField: "_id",
    foreignField: "parent",
});

// Virtual for product count
categorySchema.virtual("productCount", {
    ref: "Product",
    localField: "_id",
    foreignField: "category",
    count: true,
});

// Indexes for performance
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1, sortOrder: 1 });
categorySchema.index({ name: 1 });
categorySchema.index({ level: 1 });

// Pre-save middleware to generate slug
categorySchema.pre("save", async function (next) {
    // Generate slug if name is provided and slug is not manually set
    if (this.isModified("name") && (!this.slug || this.slug === "")) {
        let baseSlug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        let slug = baseSlug;
        let counter = 1;

        // Ensure unique slug
        while (
            await mongoose.models.Category.findOne({
                slug,
                _id: { $ne: this._id },
            })
        ) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        this.slug = slug;
    }

    // Set default alt text for image if not provided
    if (this.image && this.image.publicId && !this.image.alt) {
        this.image.alt = this.name;
    }

    next();
});

// Pre-save middleware to calculate level based on parent
categorySchema.pre("save", async function (next) {
    if (this.isModified("parent")) {
        if (this.parent) {
            const parentCategory = await mongoose.models.Category.findById(
                this.parent
            );
            if (parentCategory) {
                this.level = parentCategory.level + 1;

                // Prevent too deep nesting
                if (this.level > 3) {
                    throw new Error("Maximum category depth is 3 levels");
                }
            }
        } else {
            this.level = 0;
        }
    }
    next();
});

const Category = mongoose.model("Category", categorySchema);

export default Category;
