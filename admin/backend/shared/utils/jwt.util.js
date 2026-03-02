import jwt from "jsonwebtoken";

const generateAccessToken = (admin) => {
    const payload = {
        adminId: admin._id,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
    };

    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    });
};

const generateRefreshToken = (admin) => {
    const payload = {
        adminId: admin._id,
        tokenVersion: admin.tokenVersion || 0,
    };

    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    });
};

const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (error) {
        throw error;
    }
};

const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        throw error;
    }
};

const getAccessTokenCookieOptions = () => {
    // Get sameSite from env or default based on NODE_ENV
    const sameSite =
        process.env.COOKIE_SAME_SITE ||
        (process.env.NODE_ENV === "production" ? "strict" : "lax");

    // Get secure from env or auto-detect based on NODE_ENV
    let secure;
    if (process.env.COOKIE_SECURE === "true") {
        secure = true;
    } else if (process.env.COOKIE_SECURE === "false") {
        secure = false;
    } else {
        // Auto: secure in production, not secure in development
        secure = process.env.NODE_ENV === "production";
    }

    return {
        httpOnly: true,
        secure: secure,
        sameSite: sameSite,
        path: "/",
        maxAge: 15 * 60 * 1000, // 15 minutes
    };
};

const getRefreshTokenCookieOptions = () => {
    // Get sameSite from env or default based on NODE_ENV
    const sameSite =
        process.env.COOKIE_SAME_SITE ||
        (process.env.NODE_ENV === "production" ? "strict" : "lax");

    // Get secure from env or auto-detect based on NODE_ENV
    let secure;
    if (process.env.COOKIE_SECURE === "true") {
        secure = true;
    } else if (process.env.COOKIE_SECURE === "false") {
        secure = false;
    } else {
        // Auto: secure in production, not secure in development
        secure = process.env.NODE_ENV === "production";
    }

    return {
        httpOnly: true,
        secure: secure,
        sameSite: sameSite,
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
};

export {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    getAccessTokenCookieOptions,
    getRefreshTokenCookieOptions,
};
