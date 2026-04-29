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

// Base cookie settings read from environment variables.
// All token cookie functions share these settings, differing only in maxAge.
//
// COOKIE_HTTP_ONLY
//   "true"  — cookie inaccessible to JS (recommended; prevents XSS token theft)
//   "false" — client JS can read the cookie (only if explicitly needed)
//
// COOKIE_SECURE
//   "true"  — cookie sent only over HTTPS (set this in production)
//   "false" — cookie sent over HTTP too (use in local dev without HTTPS)
//   omit    — auto-detected: true in production, false otherwise
//
// COOKIE_SAME_SITE
//   "strict" — cookie never sent on cross-site requests (strongest CSRF protection)
//   "lax"    — cookie sent on top-level cross-site navigations (good default for dev)
//   "none"   — cookie sent on all cross-site requests; requires secure=true (for cross-origin APIs)
const getCookieBase = () => {
    const httpOnly = process.env.COOKIE_HTTP_ONLY !== "false"; // default true

    let secure;
    if (process.env.COOKIE_SECURE === "true") secure = true;
    else if (process.env.COOKIE_SECURE === "false") secure = false;
    else secure = process.env.NODE_ENV === "production"; // auto-detect

    const sameSite =
        process.env.COOKIE_SAME_SITE ||
        (process.env.NODE_ENV === "production" ? "strict" : "lax"); // auto-detect

    return { httpOnly, secure, sameSite, path: "/" };
};

const getAccessTokenCookieOptions = () => {
    const base = getCookieBase();
    return { ...base, maxAge: 15 * 60 * 1000 }; // 15 minutes
};

const getRefreshTokenCookieOptions = () => {
    const base = getCookieBase();
    return { ...base, maxAge: 7 * 24 * 60 * 60 * 1000 }; // 7 days
};

export {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    getAccessTokenCookieOptions,
    getRefreshTokenCookieOptions,
};
