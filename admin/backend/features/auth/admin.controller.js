import * as adminService from "./admin.service.js";
import apiResponse from "../../shared/utils/response.util.js";
import logger from "../../shared/utils/logger.util.js";
import {
    getAccessTokenCookieOptions,
    getRefreshTokenCookieOptions,
} from "../../shared/utils/jwt.util.js";

async function register(req, res, next) {
    try {
        const { name, email, password, role, phone, avatar } = req.body;

        if (!name || !email || !password) {
            return apiResponse.badRequest(
                res,
                "Name, email, and password are required",
            );
        }

        const createdByAdminId = req.admin._id;

        const { data } = await adminService.registerAdmin(
            { name, email, password, role, phone, avatar },
            createdByAdminId,
        );

        return apiResponse.created(res, "Admin registered successfully", data);
    } catch (error) {
        logger.error("Error in register controller:", error.message);
        if (error.message.includes("already exists")) {
            return apiResponse.conflict(res, error.message);
        }
        next(error);
    }
}

async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return apiResponse.badRequest(
                res,
                "Email and password are required",
            );
        }

        const { data } = await adminService.loginAdmin(email, password);

        res.cookie(
            "SS_admin_accessToken",
            data.accessToken,
            getAccessTokenCookieOptions(),
        );
        res.cookie(
            "SS_admin_refreshToken",
            data.refreshToken,
            getRefreshTokenCookieOptions(),
        );

        return apiResponse.success(res, "Login successful", {
            admin: data.admin,
        });
    } catch (error) {
        logger.error("Error in login controller:", error.message);
        if (
            error.message.includes("Invalid credentials") ||
            error.message.includes("deactivated")
        ) {
            return apiResponse.unauthorized(res, error.message);
        }
        next(error);
    }
}

async function logout(req, res, next) {
    try {
        const adminId = req.admin._id;

        await adminService.logoutAdmin(adminId);

        res.clearCookie("SS_admin_accessToken", getAccessTokenCookieOptions());
        res.clearCookie(
            "SS_admin_refreshToken",
            getRefreshTokenCookieOptions(),
        );

        return apiResponse.success(res, "Logout successful");
    } catch (error) {
        logger.error("Error in logout controller:", error.message);
        next(error);
    }
}

async function refreshToken(req, res, next) {
    try {
        const refreshToken = req.cookies.SS_admin_refreshToken;

        if (!refreshToken) {
            logger.warn("Refresh token not found in cookies");
            return apiResponse.unauthorized(res, "Refresh token not found");
        }

        logger.debug("Attempting to refresh access token");

        const { data } = await adminService.refreshAccessToken(refreshToken);

        res.cookie(
            "SS_admin_accessToken",
            data.accessToken,
            getAccessTokenCookieOptions(),
        );

        return apiResponse.success(res, "Token refreshed successfully");
    } catch (error) {
        logger.error("Error in refreshToken controller:", error.message);
        if (
            error.message.includes("Invalid") ||
            error.message.includes("expired") ||
            error.message.includes("not found")
        ) {
            res.clearCookie(
                "SS_admin_accessToken",
                getAccessTokenCookieOptions(),
            );
            res.clearCookie(
                "SS_admin_refreshToken",
                getRefreshTokenCookieOptions(),
            );
            return apiResponse.unauthorized(res, error.message);
        }
        next(error);
    }
}

async function getMe(req, res, next) {
    try {
        const adminId = req.admin._id;

        const { data } = await adminService.getAdminProfile(adminId);

        return apiResponse.success(
            res,
            "Admin profile fetched successfully",
            data,
        );
    } catch (error) {
        logger.error("Error in getMe controller:", error.message);
        if (error.message.includes("not found")) {
            return apiResponse.notFound(res, "Admin not found");
        }
        next(error);
    }
}

async function updateProfile(req, res, next) {
    try {
        const adminId = req.admin._id;
        const { name, phone, avatar } = req.body;

        const { data } = await adminService.updateAdminProfile(adminId, {
            name,
            phone,
            avatar,
        });

        return apiResponse.success(res, "Profile updated successfully", data);
    } catch (error) {
        logger.error("Error in updateProfile controller:", error.message);
        if (error.message.includes("not found")) {
            return apiResponse.notFound(res, "Admin not found");
        }
        next(error);
    }
}

async function changePassword(req, res, next) {
    try {
        const adminId = req.admin._id;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return apiResponse.badRequest(
                res,
                "Old password and new password are required",
            );
        }

        if (newPassword.length < 8) {
            return apiResponse.badRequest(
                res,
                "New password must be at least 8 characters",
            );
        }

        const { data } = await adminService.changePassword(
            adminId,
            oldPassword,
            newPassword,
        );

        res.clearCookie("SS_admin_accessToken", getAccessTokenCookieOptions());
        res.clearCookie(
            "SS_admin_refreshToken",
            getRefreshTokenCookieOptions(),
        );

        return apiResponse.success(
            res,
            "Password changed successfully. Please login again",
            data,
        );
    } catch (error) {
        logger.error("Error in changePassword controller:", error.message);
        if (error.message.includes("incorrect")) {
            return apiResponse.badRequest(res, error.message);
        }
        if (error.message.includes("not found")) {
            return apiResponse.notFound(res, "Admin not found");
        }
        next(error);
    }
}

async function updateAdmin(req, res, next) {
    try {
        const { adminId } = req.params;
        const { name, email, phone, role } = req.body;
        const requestingAdminId = req.admin._id;

        const { data } = await adminService.updateAdmin(
            adminId,
            { name, email, phone, role },
            requestingAdminId,
        );

        return apiResponse.success(res, "Admin updated successfully", data);
    } catch (error) {
        logger.error("Error in updateAdmin controller:", error.message);
        if (error.message.includes("not found")) {
            return apiResponse.notFound(res, "Admin not found");
        }
        if (error.message.includes("already exists")) {
            return apiResponse.conflict(res, error.message);
        }
        next(error);
    }
}

async function listAdmins(req, res, next) {
    try {
        const { data } = await adminService.listAdmins();
        return apiResponse.success(res, "Admins fetched successfully", data);
    } catch (error) {
        logger.error("Error in listAdmins controller:", error.message);
        next(error);
    }
}

async function toggleAdminStatus(req, res, next) {
    try {
        const { adminId } = req.params;
        const requestingAdminId = req.admin._id;

        const { data } = await adminService.toggleAdminStatus(
            adminId,
            requestingAdminId,
        );
        return apiResponse.success(res, "Admin status updated", data);
    } catch (error) {
        logger.error("Error in toggleAdminStatus controller:", error.message);
        if (error.message.includes("own account")) {
            return apiResponse.badRequest(res, error.message);
        }
        if (error.message.includes("not found")) {
            return apiResponse.notFound(res, "Admin not found");
        }
        next(error);
    }
}

export {
    register,
    login,
    logout,
    refreshToken,
    getMe,
    updateProfile,
    changePassword,
    listAdmins,
    updateAdmin,
    toggleAdminStatus,
};
