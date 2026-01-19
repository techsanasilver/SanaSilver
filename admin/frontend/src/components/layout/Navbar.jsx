import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
    MdMenu,
    MdSearch,
    MdNotifications,
    MdAccountCircle,
    MdPerson,
    MdSettings,
    MdLogout,
} from "react-icons/md";

const Navbar = ({ toggleSidebar, isMobile, sidebarCollapsed }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleProfile = () => {
        navigate("/profile");
        setShowProfileMenu(false);
    };

    const handleSettings = () => {
        navigate("/settings");
        setShowProfileMenu(false);
    };

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
                        SANA
                    </span>
                </div>
            </div>

            {/* Center Section - Title */}
            <div className="flex-1 flex items-center justify-center">
                <h1 className="text-lg font-semibold text-text">ADMIN PANEL</h1>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
                {/* Notifications - Commented Out */}
                {/* <button className="relative p-2 hover:bg-background rounded-lg transition-colors">
                    <MdNotifications className="w-6 h-6 text-text" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
                </button> */}

                {/* Profile with Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-2 p-2 hover:bg-background rounded-lg transition-colors"
                    >
                        <MdAccountCircle className="w-8 h-8 text-text" />
                        <span className="hidden lg:block text-sm font-medium text-text">
                            {user?.name || "Admin"}
                        </span>
                    </button>

                    {/* Dropdown Menu */}
                    {showProfileMenu && (
                        <>
                            {/* Backdrop to close dropdown */}
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowProfileMenu(false)}
                            />

                            <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-20">
                                <div className="py-1">
                                    <button
                                        onClick={handleProfile}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text hover:bg-background transition-colors"
                                    >
                                        <MdPerson className="w-5 h-5" />
                                        Profile
                                    </button>
                                    <button
                                        onClick={handleSettings}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text hover:bg-background transition-colors"
                                    >
                                        <MdSettings className="w-5 h-5" />
                                        Settings
                                    </button>
                                    <div className="border-t border-border my-1" />
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger hover:bg-background transition-colors"
                                    >
                                        <MdLogout className="w-5 h-5" />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
