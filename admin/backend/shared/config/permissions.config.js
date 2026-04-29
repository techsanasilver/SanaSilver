// ============================================================================
// Role Permissions Configuration
// Define all permission strings and role-to-permission mappings here.
// Update this file when adding new features or adjusting access levels.
// ============================================================================

// All available permission strings, organized by feature.
// Use these constants in route files instead of raw strings.
const PERMISSIONS = {
    products: {
        view: "products.view",
        create: "products.create",
        edit: "products.edit",
        delete: "products.delete",
    },
    categories: {
        view: "categories.view",
        create: "categories.create",
        edit: "categories.edit",
        delete: "categories.delete",
    },
    orders: {
        view: "orders.view",
        edit: "orders.edit",
        delete: "orders.delete",
        manage: "orders.manage", // invoices, refunds, and other order management actions
    },
    coupons: {
        view: "coupons.view",
        create: "coupons.create",
        edit: "coupons.edit",
        delete: "coupons.delete",
    },
    banners: {
        view: "banners.view",
        create: "banners.create",
        edit: "banners.edit",
        delete: "banners.delete",
    },
    users: {
        view: "users.view",
        edit: "users.edit",
        delete: "users.delete",
    },
    reviews: {
        view: "reviews.view",
        manage: "reviews.manage", // approve, reject, hide, delete
    },
    bulkOperations: {
        import: "bulk-operations.import",
        export: "bulk-operations.export",
    },
};

// Permissions assigned to each role.
// Wildcards (e.g. "products.*") grant all actions for that feature.
// "*" grants every permission (super-admin only).
const ROLE_PERMISSIONS = {
    "super-admin": ["*"],

    admin: [
        "products.*",
        "categories.*",
        "orders.*",
        "coupons.*",
        "banners.*",
        "users.view",
        "users.edit",
        "reviews.*",
        "bulk-operations.*",
    ],

    manager: [
        "products.view",
        "products.edit",
        "categories.view",
        "orders.view",
        "orders.edit",
        "orders.manage",
        "banners.view",
        "reviews.view",
        "reviews.manage",
    ],

    staff: ["products.view", "orders.view", "reviews.view"],
};

// Checks whether an admin's permission list satisfies a required permission.
// Supports:
//   "*"           — grants everything (super-admin)
//   "feature.*"   — grants all actions for that feature
//   "feature.action" — grants a specific action
function hasPermission(adminPermissions, requiredPermission) {
    if (adminPermissions.includes("*")) {
        return true;
    }

    if (adminPermissions.includes(requiredPermission)) {
        return true;
    }

    const [resource] = requiredPermission.split(".");
    return adminPermissions.includes(`${resource}.*`);
}

export { PERMISSIONS, ROLE_PERMISSIONS, hasPermission };
