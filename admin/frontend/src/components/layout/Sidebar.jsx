import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
    MdDashboard,
    MdInventory,
    MdShoppingCart,
    MdPeople,
    MdSettings,
    MdAnalytics,
    MdExpandMore,
    MdExpandLess,
    MdAdd,
    MdList,
    MdCategory,
    MdCloudSync,
    MdViewCarousel,
} from "react-icons/md";

const Sidebar = ({ isOpen, isCollapsed, isMobile, onClose }) => {
    const [expandedMenus, setExpandedMenus] = useState({
        products: false,
    });

    const toggleMenu = (menuKey) => {
        setExpandedMenus((prev) => ({
            ...prev,
            [menuKey]: !prev[menuKey],
        }));
    };

    const menuItems = [
        { path: "/", icon: MdDashboard, label: "Home" },
        { path: "/analytics", icon: MdAnalytics, label: "Analytics" },
        {
            key: "products",
            icon: MdInventory,
            label: "Products",
            submenu: [
                { path: "/products", icon: MdList, label: "All Products" },
                { path: "/products/add", icon: MdAdd, label: "Add Product" },
                {
                    path: "/products/categories",
                    icon: MdCategory,
                    label: "Categories",
                },
            ],
        },
        { path: "/orders", icon: MdShoppingCart, label: "Orders" },
        { path: "/customers", icon: MdPeople, label: "Customers" },
        { path: "/banners", icon: MdViewCarousel, label: "Banners" },
        {
            path: "/bulk-operations",
            icon: MdCloudSync,
            label: "Bulk Operations",
        },
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
                    {menuItems.map((item) => {
                        // Item with submenu
                        if (item.submenu) {
                            const isExpanded = expandedMenus[item.key];

                            return (
                                <li key={item.key}>
                                    {/* Parent Menu Item */}
                                    <button
                                        onClick={() => toggleMenu(item.key)}
                                        className={`
                                            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                                            transition-colors duration-200
                                            text-text hover:bg-background
                                            ${isCollapsed && !isMobile ? "justify-center" : "justify-between"}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className="w-5 h-5 shrink-0" />
                                            {(!isCollapsed || isMobile) && (
                                                <span className="text-sm">
                                                    {item.label}
                                                </span>
                                            )}
                                        </div>

                                        {(!isCollapsed || isMobile) &&
                                            (isExpanded ? (
                                                <MdExpandLess className="w-4 h-4 shrink-0" />
                                            ) : (
                                                <MdExpandMore className="w-4 h-4 shrink-0" />
                                            ))}
                                    </button>

                                    {/* Submenu Items */}
                                    {isExpanded &&
                                        (!isCollapsed || isMobile) && (
                                            <ul className="mt-1 ml-4 space-y-1 border-l border-border pl-3">
                                                {item.submenu.map((subitem) => (
                                                    <li key={subitem.path}>
                                                        <NavLink
                                                            to={subitem.path}
                                                            onClick={() =>
                                                                isMobile &&
                                                                onClose()
                                                            }
                                                            className={({
                                                                isActive,
                                                            }) =>
                                                                `
                                                            flex items-center gap-3 px-3 py-2 rounded-lg
                                                            transition-colors duration-200
                                                            ${
                                                                isActive
                                                                    ? "bg-accent text-primary font-medium"
                                                                    : "text-text hover:bg-background"
                                                            }
                                                        `
                                                            }
                                                            end={
                                                                subitem.path ===
                                                                "/products"
                                                            }
                                                        >
                                                            <subitem.icon className="w-4 h-4 shrink-0" />
                                                            <span className="text-sm">
                                                                {subitem.label}
                                                            </span>
                                                        </NavLink>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                </li>
                            );
                        }

                        // Regular menu item
                        return (
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
                                        ${isCollapsed && !isMobile ? "justify-center" : ""}
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
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;
