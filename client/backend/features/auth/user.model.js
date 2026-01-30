import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["home", "office", "other"],
            default: "home",
        },
        name: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        addressLine1: {
            type: String,
            required: true,
        },
        addressLine2: {
            type: String,
        },
        city: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        pincode: {
            type: String,
            required: true,
        },
        landmark: {
            type: String,
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
    },
    { _id: true },
);

const userSchema = new mongoose.Schema(
    {
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            unique: true,
            validate: {
                validator: function (v) {
                    // Validate Indian phone number with +91 prefix
                    return /^\+91[6-9]\d{9}$/.test(v);
                },
                message: "Please provide a valid Indian phone number",
            },
        },
        firstName: {
            type: String,
            trim: true,
            maxlength: [50, "First name cannot exceed 50 characters"],
        },
        lastName: {
            type: String,
            trim: true,
            maxlength: [50, "Last name cannot exceed 50 characters"],
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            validate: {
                validator: function (v) {
                    if (!v) return true; // Email is optional
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
                },
                message: "Please provide a valid email address",
            },
        },
        addresses: [addressSchema],
        isActive: {
            type: Boolean,
            default: true,
        },
        tokenVersion: {
            type: Number,
            default: 0,
        },
        lastLoginAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    },
);

// Index for faster queries (phone already has unique index)
userSchema.index({ isActive: 1 });

const User = mongoose.model("User", userSchema);

export default User;
