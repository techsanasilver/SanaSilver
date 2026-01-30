/**
 * Authentication Middleware
 * Protects routes requiring authentication
 * Verifies JWT access token and attaches user to request
 */

import jwt from "jsonwebtoken";
import apiResponse from "../utils/response.util.js";
import logger from "../utils/logger.util.js";

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken;

        if (!token) {
            return apiResponse.unauthorized(res, "Access token required");
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return apiResponse.unauthorized(
                    res,
                    "Token expired. Please refresh your token"
                );
            }
            return apiResponse.unauthorized(res, "Invalid token");
        }

        // Note: Once you create User model, import it and verify user exists
        // import User from "../../features/auth/user.model.js";
        // const user = await User.findById(decoded.userId);
        // if (!user) {
        //     return apiResponse.unauthorized(res, "User not found");
        // }
        // if (!user.isActive) {
        //     return apiResponse.forbidden(res, "Your account has been deactivated");
        // }
        // req.user = user;

        // For now, just attach decoded token to request
        req.user = decoded;

        logger.info(`User authenticated: ${decoded.email}`);
        next();
    } catch (error) {
        logger.error("Auth middleware error:", error.message);
        return apiResponse.error(res, "Authentication failed");
    }
};

export default authMiddleware;
