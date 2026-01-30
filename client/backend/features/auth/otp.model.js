import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const otpSchema = new mongoose.Schema(
    {
        phone: {
            type: String,
            required: true,
            validate: {
                validator: function (v) {
                    return /^\+91[6-9]\d{9}$/.test(v);
                },
                message: "Please provide a valid Indian phone number",
            },
        },
        otp: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        },
        attempts: {
            type: Number,
            default: 0,
            max: 3,
        },
        isUsed: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    },
);

// Index for automatic deletion of expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ phone: 1 });

// Hash OTP before saving
otpSchema.pre("save", async function (next) {
    if (!this.isModified("otp")) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.otp = await bcrypt.hash(this.otp, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare OTP
otpSchema.methods.compareOTP = async function (candidateOTP) {
    return await bcrypt.compare(candidateOTP, this.otp);
};

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;
