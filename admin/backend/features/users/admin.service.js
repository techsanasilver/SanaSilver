import Admin from "./admin.model.js";
import logger from "../../shared/utils/logger.util.js";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from "../../shared/utils/jwt.util.js";

// Permission definitions per role
const ROLE_PERMISSIONS = {
    "super-admin": ["*"],
    admin: [
        "products.*",
        "orders.*",
        "users.view",
        "users.edit",
        "coupons.*",
        "categories.*",
    ],
    manager: [
        "products.view",
        "products.edit",
        "orders.view",
        "orders.edit",
        "categories.view",
    ],
    staff: ["products.view", "orders.view"],
};

async function registerAdmin(data, createdByAdminId) {
    const { name, email, password, role = "staff", phone, avatar } = data;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
        throw new Error("Admin with this email already exists");
    }

    const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.staff;

    const admin = await Admin.create({
        name,
        email,
        password,
        role,
        permissions,
        phone,
        avatar,
    });

    logger.info(
        `New admin registered: ${email} with role: ${role} by admin: ${createdByAdminId}`
    );

    const adminData = admin.toObject();
    delete adminData.password;

    return { data: adminData };
}

async function loginAdmin(email, password) {
    const admin = await Admin.findOne({ email }).select("+password");

    if (!admin) {
        throw new Error("Invalid credentials");
    }

    if (!admin.isActive) {
        throw new Error("Account is deactivated");
    }

    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
        throw new Error("Invalid credentials");
    }

    await updateLastLogin(admin._id);

    const accessToken = generateAccessToken(admin);
    const refreshToken = generateRefreshToken(admin);

    const adminData = admin.toObject();
    delete adminData.password;

    logger.info(`Admin logged in: ${email}`);

    return {
        data: {
            admin: adminData,
            accessToken,
            refreshToken,
        },
    };
}

async function refreshAccessToken(refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);

    const admin = await Admin.findById(decoded.adminId);

    if (!admin) {
        throw new Error("Admin not found");
    }

    if (!admin.isActive) {
        throw new Error("Account is deactivated");
    }

    if (admin.tokenVersion !== decoded.tokenVersion) {
        throw new Error("Invalid refresh token");
    }

    const newAccessToken = generateAccessToken(admin);

    logger.info(`Access token refreshed for admin: ${admin.email}`);

    return {
        data: {
            accessToken: newAccessToken,
        },
    };
}

async function logoutAdmin(adminId) {
    await Admin.findByIdAndUpdate(adminId, {
        $inc: { tokenVersion: 1 },
    });

    logger.info(`Admin logged out: ${adminId}`);

    return { data: { message: "Logged out successfully" } };
}

async function getAdminProfile(adminId) {
    const admin = await Admin.findById(adminId);

    if (!admin) {
        throw new Error("Admin not found");
    }

    const adminData = admin.toObject();
    delete adminData.password;

    return { data: adminData };
}

async function updateAdminProfile(adminId, updates) {
    const { name, phone, avatar } = updates;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;

    const admin = await Admin.findByIdAndUpdate(adminId, updateData, {
        new: true,
        runValidators: true,
    });

    if (!admin) {
        throw new Error("Admin not found");
    }

    const adminData = admin.toObject();
    delete adminData.password;

    logger.info(`Admin profile updated: ${admin.email}`);

    return { data: adminData };
}

async function changePassword(adminId, oldPassword, newPassword) {
    const admin = await Admin.findById(adminId).select("+password");

    if (!admin) {
        throw new Error("Admin not found");
    }

    const isPasswordValid = await admin.comparePassword(oldPassword);

    if (!isPasswordValid) {
        throw new Error("Current password is incorrect");
    }

    admin.password = newPassword;
    await admin.save();

    await Admin.findByIdAndUpdate(adminId, {
        $inc: { tokenVersion: 1 },
    });

    logger.info(`Password changed for admin: ${admin.email}`);

    return { data: { message: "Password changed successfully" } };
}

async function updateLastLogin(adminId) {
    await Admin.findByIdAndUpdate(adminId, {
        lastLogin: new Date(),
    });
}

function getRolePermissions(role) {
    return ROLE_PERMISSIONS[role] || [];
}

function hasPermission(adminPermissions, requiredPermission) {
    if (adminPermissions.includes("*")) {
        return true;
    }

    if (adminPermissions.includes(requiredPermission)) {
        return true;
    }

    const [resource, action] = requiredPermission.split(".");
    const wildcardPermission = `${resource}.*`;

    return adminPermissions.includes(wildcardPermission);
}

export {
    registerAdmin,
    loginAdmin,
    refreshAccessToken,
    logoutAdmin,
    getAdminProfile,
    updateAdminProfile,
    changePassword,
    getRolePermissions,
    hasPermission,
    ROLE_PERMISSIONS,
};
