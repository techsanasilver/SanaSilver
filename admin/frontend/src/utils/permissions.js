// Frontend permission constants — mirrors admin/backend/shared/config/permissions.config.js
// Use these in PermissionGuard, ProtectedRoute, and Sidebar instead of raw strings.

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
        manage: "orders.manage",
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
        manage: "reviews.manage",
    },
    bulkOperations: {
        import: "bulk-operations.import",
        export: "bulk-operations.export",
    },
};

export default PERMISSIONS;
