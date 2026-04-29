import { NavLink } from "react-router-dom";
import {
    MdDashboard,
    MdInventory,
    MdShoppingCart,
    MdPeople,
    MdSettings,
    MdAnalytics,
    MdCategory,
    MdCloudSync,
    MdViewCarousel,
    MdLocalOffer,
    MdRateReview,
    MdLock,
    MdAdminPanelSettings,
} from "react-icons/md";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ isOpen, isCollapsed, isMobile, onClose }) => {
    const { hasPermission, hasRole } = useAuth();

    // Each item: path, icon, label, permission (null = always accessible), role (null = any role)
    const menuItems = [
        { path: "/", icon: MdDashboard, label: "Home", permission: null },
        {
            path: "/analytics",
            icon: MdAnalytics,
            label: "Analytics",
            permission: null,
        },
        {
            path: "/products",
            icon: MdInventory,
            label: "Products",
            permission: "products.view",
        },
        {
            path: "/categories",
            icon: MdCategory,
            label: "Categories",
            permission: "categories.view",
        },
        {
            path: "/orders",
            icon: MdShoppingCart,
            label: "Orders",
            permission: "orders.view",
        },
        {
            path: "/customers",
            icon: MdPeople,
            label: "Customers",
            permission: "users.view",
        },
        {
            path: "/banners",
            icon: MdViewCarousel,
            label: "Banners",
            permission: "banners.view",
        },
        {
            path: "/coupons",
            icon: MdLocalOffer,
            label: "Coupons",
            permission: "coupons.view",
        },
        {
            path: "/reviews",
            icon: MdRateReview,
            label: "Reviews",
            permission: "reviews.view",
        },
        {
            path: "/bulk-operations",
            icon: MdCloudSync,
            label: "Bulk Operations",
            permission: "bulk-operations.export",
        },
        {
            path: "/admins",
            icon: MdAdminPanelSettings,
            label: "Admin Users",
            permission: null,
            role: "super-admin",
        },
        {
            path: "/settings",
            icon: MdSettings,
            label: "Settings",
            permission: null,
        },
    ];

    const sidebarClasses = `
        ${isMobile ? "fixed" : "relative"}
        h-full bg-surface border-r border-border shadow-xl
        transition-all duration-300 ease-in-out
        ${isMobile ? "z-40" : ""}
        ${isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"}
        ${!isMobile && isCollapsed ? "w-16" : "w-64"}
    `;

    return (
        <aside className={sidebarClasses}>
            <nav className="h-full overflow-y-auto py-4">
                <ul className="space-y-1 px-2">
                    {menuItems.map((item) => {
                        const isAuthorized =
                            (!item.permission ||
                                hasPermission(item.permission)) &&
                            (!item.role || hasRole(item.role));

                        // Hide role-restricted items entirely if user doesn't have the role
                        if (item.role && !hasRole(item.role)) return null;

                        return (
                            <li key={item.path}>
                                {isAuthorized ? (
                                    <NavLink
                                        to={item.path}
                                        onClick={() => isMobile && onClose()}
                                        end={item.path === "/"}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200
                                            ${isActive ? "bg-accent text-primary font-medium" : "text-text hover:bg-background"}
                                            ${isCollapsed && !isMobile ? "justify-center" : ""}`
                                        }
                                    >
                                        <item.icon className="w-5 h-5 shrink-0" />
                                        {(!isCollapsed || isMobile) && (
                                            <span className="text-sm">
                                                {item.label}
                                            </span>
                                        )}
                                    </NavLink>
                                ) : (
                                    <div
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-not-allowed
                                            text-text-secondary opacity-50
                                            ${isCollapsed && !isMobile ? "justify-center" : ""}`}
                                        title="You don't have permission to access this"
                                    >
                                        <item.icon className="w-5 h-5 shrink-0" />
                                        {(!isCollapsed || isMobile) && (
                                            <>
                                                <span className="text-sm flex-1">
                                                    {item.label}
                                                </span>
                                                <MdLock className="w-3.5 h-3.5 shrink-0" />
                                            </>
                                        )}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;
