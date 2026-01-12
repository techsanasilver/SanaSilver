import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
    {
        publicId: {
            type: String,
            required: [true, "Image public ID is required"],
        },
        url: {
            type: String,
            required: [true, "Image URL is required"],
        },
        alt: {
            type: String,
            default: "",
        },
        urls: {
            thumbnail: String,
            small: String,
            medium: String,
            large: String,
            original: String,
        },
    },
    { _id: false }
);

const bannerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Banner title is required"],
            trim: true,
            maxlength: [100, "Title cannot exceed 100 characters"],
        },
        subtitle: {
            type: String,
            trim: true,
            maxlength: [200, "Subtitle cannot exceed 200 characters"],
        },
        link: {
            type: {
                type: String,
                enum: ["internal", "external"],
                default: "internal",
            },
            url: {
                type: String,
                trim: true,
            },
        },
        buttonText: {
            type: String,
            trim: true,
            maxlength: [50, "Button text cannot exceed 50 characters"],
        },
        displayLocation: {
            type: String,
            enum: ["home", "shop", "about", "contact", "all"],
            default: "home",
        },
        sortOrder: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        desktopImage: {
            type: imageSchema,
            required: [true, "Desktop image is required"],
        },
        mobileImage: {
            type: imageSchema,
        },
    },
    {
        timestamps: true,
    }
);

// Index for sorting and filtering
bannerSchema.index({ displayLocation: 1, sortOrder: 1 });
bannerSchema.index({ isActive: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });

// Virtual to check if banner is currently scheduled
bannerSchema.virtual("isScheduled").get(function () {
    if (!this.startDate && !this.endDate) return true;

    const now = new Date();
    const isAfterStart = !this.startDate || now >= this.startDate;
    const isBeforeEnd = !this.endDate || now <= this.endDate;

    return isAfterStart && isBeforeEnd;
});

// Method to check if banner should be displayed
bannerSchema.methods.shouldDisplay = function () {
    return this.isActive && this.isScheduled;
};

const Banner = mongoose.model("Banner", bannerSchema);

export default Banner;
