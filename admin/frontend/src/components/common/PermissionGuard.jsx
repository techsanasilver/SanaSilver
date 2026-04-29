import React from "react";
import { MdLock } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";

// PermissionGuard wraps any UI element and enforces permission checks.
//
// Props:
//   permission  — required permission string, e.g. "products.create"
//   role        — required role string, e.g. "super-admin" (checked in addition to permission if provided)
//   fallback    — what to render when unauthorized; defaults to a locked visual clone
//   children    — the content to render when authorized
//
// Usage:
//   <PermissionGuard permission="products.create">
//     <button>Add Product</button>
//   </PermissionGuard>
//
//   <PermissionGuard role="super-admin">
//     <button>Admin Action</button>
//   </PermissionGuard>

const PermissionGuard = ({ permission, role, children, fallback }) => {
    const { hasPermission, hasRole } = useAuth();

    const authorized =
        (!permission || hasPermission(permission)) && (!role || hasRole(role));

    if (authorized) return children;

    if (fallback !== undefined) return fallback;

    // Default fallback: render children visually, but disabled + lock icon overlay
    return (
        <span className="relative inline-flex items-center group cursor-not-allowed select-none">
            <span className="pointer-events-none opacity-40">{children}</span>
            <MdLock className="absolute -top-1 -right-1 w-3.5 h-3.5 text-text-secondary bg-surface rounded-full p-px shrink-0" />
            {/* Tooltip */}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                You don't have permission
            </span>
        </span>
    );
};

export default PermissionGuard;
