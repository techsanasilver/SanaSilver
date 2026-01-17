import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile viewport
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth < 1024) {
                setSidebarOpen(false);
            }
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Load sidebar state from localStorage
    useEffect(() => {
        const savedCollapsed = localStorage.getItem("sidebarCollapsed");
        if (savedCollapsed !== null) {
            setSidebarCollapsed(JSON.parse(savedCollapsed));
        }
    }, []);

    const toggleSidebar = () => {
        if (isMobile) {
            setSidebarOpen(!sidebarOpen);
        } else {
            const newCollapsed = !sidebarCollapsed;
            setSidebarCollapsed(newCollapsed);
            localStorage.setItem(
                "sidebarCollapsed",
                JSON.stringify(newCollapsed)
            );
        }
    };

    const closeSidebar = () => {
        if (isMobile) {
            setSidebarOpen(false);
        }
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-background">
            {/* Navbar - Full Width */}
            <Navbar
                toggleSidebar={toggleSidebar}
                isMobile={isMobile}
                sidebarCollapsed={sidebarCollapsed}
            />

            {/* Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <Sidebar
                    isOpen={sidebarOpen}
                    isCollapsed={sidebarCollapsed}
                    isMobile={isMobile}
                    onClose={closeSidebar}
                />

                {/* Mobile Backdrop */}
                {isMobile && sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-primary/50 backdrop-blur-sm z-30 lg:hidden"
                        onClick={closeSidebar}
                    />
                )}

                {/* Main Content + Footer Column */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Main Content - Scrollable */}
                    <main className="flex-1 overflow-auto p-6">
                        <Outlet />
                    </main>

                    {/* Footer */}
                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default Layout;
