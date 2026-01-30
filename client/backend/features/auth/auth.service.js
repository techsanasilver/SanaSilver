import User from "./user.model.js";
import OTP from "./otp.model.js";
import logger from "../../shared/utils/logger.util.js";

// Hardcoded test phone numbers that bypass real OTP
const TEST_PHONE_NUMBERS = ["+919999999999", "+918888888888", "+917777777777"];

// Hardcoded OTP for development (will be replaced with MSG91 integration)
const HARDCODED_OTP = "111111";

/**
 * Normalize phone number to +91 format
 */
const normalizePhoneNumber = (phone) => {
    // Remove all spaces and special characters
    let normalized = phone.replace(/[\s\-\(\)]/g, "");

    // If starts with +91, return as is
    if (normalized.startsWith("+91")) {
        return normalized;
    }

    // If starts with 91, add +
    if (normalized.startsWith("91") && normalized.length === 12) {
        return `+${normalized}`;
    }

    // If 10 digits, add +91
    if (normalized.length === 10) {
        return `+91${normalized}`;
    }

    throw new Error("Invalid phone number format");
};

/**
 * Validate Indian phone number
 */
const validateIndianPhone = (phone) => {
    const normalized = normalizePhoneNumber(phone);
    // Check if it's a valid Indian number (starts with 6-9)
    return /^\+91[6-9]\d{9}$/.test(normalized);
};

/**
 * Check if phone number is a test number
 */
const isTestPhoneNumber = (phone) => {
    return TEST_PHONE_NUMBERS.includes(phone);
};

/**
 * Send OTP to phone number
 */
const sendOTP = async (phone) => {
    try {
        // Normalize phone number
        const normalizedPhone = normalizePhoneNumber(phone);

        // Validate phone number
        if (!validateIndianPhone(normalizedPhone)) {
            throw new Error("Invalid Indian phone number");
        }

        logger.info(`OTP request for phone: ${normalizedPhone}`);

        // Check rate limiting: Max 3 OTP requests per 15 minutes
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const recentOTPCount = await OTP.countDocuments({
            phone: normalizedPhone,
            createdAt: { $gte: fifteenMinutesAgo },
        });

        if (recentOTPCount >= 3) {
            throw new Error(
                "Too many OTP requests. Please try again after 15 minutes",
            );
        }

        // Delete any existing unused OTPs for this phone
        await OTP.deleteMany({ phone: normalizedPhone, isUsed: false });

        // Generate OTP
        // TODO: Integrate MSG91 for real OTP generation and sending
        // For now, using hardcoded OTP: 111111
        const otpCode = HARDCODED_OTP;

        // Create OTP record
        const otpRecord = new OTP({
            phone: normalizedPhone,
            otp: otpCode,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        });

        await otpRecord.save();

        // TODO: Send OTP via MSG91
        // await sendSMS(normalizedPhone, `Your Sana Silver OTP is: ${otpCode}. Valid for 5 minutes.`);

        logger.info(`OTP sent successfully to ${normalizedPhone}`);
        logger.debug(`OTP for ${normalizedPhone}: ${otpCode}`); // Only in development

        return {
            message: "OTP sent successfully",
            phone: normalizedPhone,
            // For development only - remove in production
            ...(process.env.NODE_ENV !== "production" && { otp: otpCode }),
        };
    } catch (error) {
        logger.error("Error sending OTP:", error.message);
        throw error;
    }
};

/**
 * Verify OTP and authenticate user
 */
const verifyOTP = async (phone, otp) => {
    try {
        // Normalize phone number
        const normalizedPhone = normalizePhoneNumber(phone);

        logger.info(`OTP verification attempt for phone: ${normalizedPhone}`);

        // For test numbers, always accept hardcoded OTP
        const isTestNumber = isTestPhoneNumber(normalizedPhone);

        if (isTestNumber) {
            logger.info(`Test phone number detected: ${normalizedPhone}`);
            if (otp === HARDCODED_OTP) {
                // Find or create user
                let user = await User.findOne({ phone: normalizedPhone });

                if (!user) {
                    logger.info(
                        `Creating new user for test phone: ${normalizedPhone}`,
                    );
                    user = new User({
                        phone: normalizedPhone,
                    });
                    await user.save();
                }

                // Update last login
                user.lastLoginAt = new Date();
                await user.save();

                logger.info(
                    `Test user authenticated successfully: ${user._id}`,
                );

                return {
                    user,
                    isNewUser: !user.firstName,
                };
            } else {
                throw new Error("Invalid OTP");
            }
        }

        // Find OTP record
        const otpRecord = await OTP.findOne({
            phone: normalizedPhone,
            isUsed: false,
        }).sort({ createdAt: -1 });

        if (!otpRecord) {
            throw new Error("OTP not found or already used");
        }

        // Check if OTP is expired
        if (otpRecord.expiresAt < new Date()) {
            throw new Error("OTP has expired. Please request a new one");
        }

        // Check attempts
        if (otpRecord.attempts >= 3) {
            throw new Error(
                "Maximum OTP attempts exceeded. Please request a new OTP",
            );
        }

        // Increment attempts
        otpRecord.attempts += 1;
        await otpRecord.save();

        // Verify OTP
        const isOTPValid = await otpRecord.compareOTP(otp);

        if (!isOTPValid) {
            logger.warn(
                `Invalid OTP attempt for ${normalizedPhone}. Attempts: ${otpRecord.attempts}/3`,
            );
            throw new Error("Invalid OTP");
        }

        // Mark OTP as used
        otpRecord.isUsed = true;
        await otpRecord.save();

        // Find or create user
        let user = await User.findOne({ phone: normalizedPhone });
        let isNewUser = false;

        if (!user) {
            logger.info(`Creating new user for phone: ${normalizedPhone}`);
            user = new User({
                phone: normalizedPhone,
            });
            await user.save();
            isNewUser = true;
        } else {
            // Check if user is active
            if (!user.isActive) {
                throw new Error(
                    "Your account has been deactivated. Please contact support",
                );
            }
        }

        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        logger.info(`User authenticated successfully: ${user._id}`);

        return {
            user,
            isNewUser: !user.firstName, // User is new if they haven't completed profile
        };
    } catch (error) {
        logger.error("Error verifying OTP:", error.message);
        throw error;
    }
};

/**
 * Get user profile
 */
const getUserProfile = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new Error("User not found");
        }

        if (!user.isActive) {
            throw new Error("User account is deactivated");
        }

        return user;
    } catch (error) {
        logger.error("Error fetching user profile:", error.message);
        throw error;
    }
};

/**
 * Update user profile
 */
const updateUserProfile = async (userId, updateData) => {
    try {
        // Prevent updating sensitive fields
        delete updateData.phone;
        delete updateData.isActive;
        delete updateData.tokenVersion;

        const user = await User.findByIdAndUpdate(userId, updateData, {
            new: true,
            runValidators: true,
        });

        if (!user) {
            throw new Error("User not found");
        }

        logger.info(`User profile updated: ${user._id}`);

        return user;
    } catch (error) {
        logger.error("Error updating user profile:", error.message);
        throw error;
    }
};

/**
 * Invalidate all refresh tokens for a user
 */
const invalidateUserTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new Error("User not found");
        }

        user.tokenVersion += 1;
        await user.save();

        logger.info(`Tokens invalidated for user: ${user._id}`);

        return user;
    } catch (error) {
        logger.error("Error invalidating tokens:", error.message);
        throw error;
    }
};

export {
    sendOTP,
    verifyOTP,
    getUserProfile,
    updateUserProfile,
    invalidateUserTokens,
    normalizePhoneNumber,
    validateIndianPhone,
};
