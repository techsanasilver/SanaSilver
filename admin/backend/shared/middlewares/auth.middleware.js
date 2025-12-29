/**
 * Authentication Middleware
 * Protects routes requiring authentication
 * Verifies JWT access token and attaches admin to request
 */

import jwt from "jsonwebtoken";
import apiResponse from "../utils/response.util.js";
import logger from "../utils/logger.util.js";
import Admin from "../../features/users/admin.model.js";

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

        const admin = await Admin.findById(decoded.adminId);

        if (!admin) {
            return apiResponse.unauthorized(res, "Admin not found");
        }

        if (!admin.isActive) {
            return apiResponse.forbidden(
                res,
                "Your account has been deactivated. Please contact support"
            );
        }

        req.admin = admin;

        logger.info(`Admin authenticated: ${admin.email} (${admin.role})`);
        next();
    } catch (error) {
        logger.error("Auth middleware error:", error.message);
        return apiResponse.error(res, "Authentication failed");
    }
};

export default authMiddleware;
