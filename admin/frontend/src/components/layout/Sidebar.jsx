import React from "react";
import { NavLink } from "react-router-dom";
import {
    MdDashboard,
    MdInventory,
    MdShoppingCart,
    MdPeople,
    MdSettings,
    MdAnalytics,
} from "react-icons/md";

const Sidebar = ({ isOpen, isCollapsed, isMobile, onClose }) => {
    const menuItems = [
        { path: "/", icon: MdDashboard, label: "Home" },
        { path: "/analytics", icon: MdAnalytics, label: "Analytics" },
        { path: "/products", icon: MdInventory, label: "Products" },
        { path: "/orders", icon: MdShoppingCart, label: "Orders" },
        { path: "/customers", icon: MdPeople, label: "Customers" },
        { path: "/bulk-operations", icon: MdPeople, label: "Bulk Operations" },
        { path: "/settings", icon: MdSettings, label: "Settings" },
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
                    {menuItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                onClick={() => isMobile && onClose()}
                                className={({ isActive }) =>
                                    `
                                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                                    transition-colors duration-200
                                    ${
                                        isActive
                                            ? "bg-accent text-primary font-medium"
                                            : "text-text hover:bg-background"
                                    }
                                    ${
                                        isCollapsed && !isMobile
                                            ? "justify-center"
                                            : ""
                                    }
                                `
                                }
                            >
                                <item.icon className="w-5 h-5 shrink-0" />
                                {(!isCollapsed || isMobile) && (
                                    <span className="text-sm">
                                        {item.label}
                                    </span>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;
