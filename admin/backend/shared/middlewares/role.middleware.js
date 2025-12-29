import apiResponse from "../utils/response.util.js";
import logger from "../utils/logger.util.js";
import { hasPermission } from "../../features/users/admin.service.js";

function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.admin) {
            logger.warn("Role check failed: No admin in request");
            return apiResponse.unauthorized(res, "Authentication required");
        }

        const adminRole = req.admin.role;

        if (!allowedRoles.includes(adminRole)) {
            logger.warn(
                `Role check failed: Admin ${
                    req.admin.email
                } (${adminRole}) attempted to access route requiring ${allowedRoles.join(
                    ", "
                )}`
            );
            return apiResponse.forbidden(
                res,
                "You do not have permission to access this resource"
            );
        }

        next();
    };
}

function requirePermission(...requiredPermissions) {
    return (req, res, next) => {
        if (!req.admin) {
            logger.warn("Permission check failed: No admin in request");
            return apiResponse.unauthorized(res, "Authentication required");
        }

        const adminPermissions = req.admin.permissions || [];

        const hasAllPermissions = requiredPermissions.every((permission) =>
            hasPermission(adminPermissions, permission)
        );

        if (!hasAllPermissions) {
            logger.warn(
                `Permission check failed: Admin ${
                    req.admin.email
                } lacks required permissions: ${requiredPermissions.join(", ")}`
            );
            return apiResponse.forbidden(
                res,
                "You do not have permission to perform this action"
            );
        }

        next();
    };
}

function requireSuperAdmin() {
    return requireRole("super-admin");
}

export { requireRole, requirePermission, requireSuperAdmin };
