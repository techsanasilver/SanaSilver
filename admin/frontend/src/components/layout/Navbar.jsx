import React from "react";
import { useAuth } from "../../context/AuthContext";
import {
    MdMenu,
    MdSearch,
    MdNotifications,
    MdAccountCircle,
} from "react-icons/md";

const Navbar = ({ toggleSidebar, isMobile, sidebarCollapsed }) => {
    const { user } = useAuth();

    return (
        <nav className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 lg:px-6 lg:pl-2 z-50">
            {/* Left Section */}
            <div className="flex items-center gap-4">
                {/* Menu Toggle */}
                <button
                    onClick={toggleSidebar}
                    className="p-3 hover:bg-background rounded-lg transition-colors"
                    aria-label="Toggle sidebar"
                >
                    <MdMenu className="w-6 h-6 text-text" />
                </button>

                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                        <span className="text-primary font-bold text-sm">
                            SS
                        </span>
                    </div>
                    <span className="hidden sm:block font-bold text-lg text-primary">
                        Sana Silver
                    </span>
                </div>
            </div>

            {/* Center Section - Search */}
            <div className="flex-1 max-w-md mx-4 hidden md:block">
                <div className="relative">
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input
                        type="search"
                        placeholder="Search..."
                        className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
                {/* Search Icon (Mobile) */}
                <button className="md:hidden p-2 hover:bg-background rounded-lg transition-colors">
                    <MdSearch className="w-6 h-6 text-text" />
                </button>

                {/* Notifications */}
                <button className="relative p-2 hover:bg-background rounded-lg transition-colors">
                    <MdNotifications className="w-6 h-6 text-text" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
                </button>

                {/* Profile */}
                <button className="flex items-center gap-2 p-2 hover:bg-background rounded-lg transition-colors">
                    <MdAccountCircle className="w-8 h-8 text-text" />
                    <span className="hidden lg:block text-sm font-medium text-text">
                        {user?.name || "Admin"}
                    </span>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
