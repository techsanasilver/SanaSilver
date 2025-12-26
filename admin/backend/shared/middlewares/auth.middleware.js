/**
 * Authentication Middleware
 * Protects routes requiring authentication
 */

import jwt from "jsonwebtoken";
import apiResponse from "../utils/response.util.js";
import logger from "../utils/logger.util.js";

const authMiddleware = async (req, res, next) => {
    try {
        const token =
            req.cookies.token || req.headers.authorization?.split(" ")[1];

        if (!token) {
            return apiResponse.unauthorized(res, "Access token required");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        logger.info(`User ${decoded.id} authenticated`);
        next();
    } catch (error) {
        logger.error("Auth middleware error:", error.message);
        return apiResponse.unauthorized(res, "Invalid or expired token");
    }
};

export default authMiddleware;
