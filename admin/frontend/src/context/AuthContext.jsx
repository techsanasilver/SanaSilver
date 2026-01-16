/**
 * Authentication Context
 * Global state management for user authentication
 * Backend uses httpOnly cookies for tokens
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { getProfile } from "../api/auth.api";
import logger from "../utils/logger.util";

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Initialize auth state by checking with backend
     * Tokens are in httpOnly cookies, so we verify by calling /admin/me
     */
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Try to get stored user data
                const storedUser = localStorage.getItem("user");

                if (storedUser) {
                    // Verify with backend (cookies sent automatically)
                    try {
                        const response = await getProfile();
                        const userData = response.data;

                        setUser(userData);
                        setIsAuthenticated(true);
                        localStorage.setItem("user", JSON.stringify(userData));

                        logger.info("User session restored", {
                            userId: userData._id,
                        });
                    } catch (error) {
                        // Token invalid or expired, clear data
                        logger.warn("Session validation failed:", error);
                        localStorage.removeItem("user");
                        setUser(null);
                        setIsAuthenticated(false);
                    }
                }
            } catch (error) {
                logger.error("Failed to initialize auth:", error);
                localStorage.removeItem("user");
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();

        // Listen for logout events from axios interceptor
        const handleLogout = () => {
            setUser(null);
            setIsAuthenticated(false);
        };

        window.addEventListener("auth:logout", handleLogout);

        return () => {
            window.removeEventListener("auth:logout", handleLogout);
        };
    }, []);

    /**
     * Login handler
     * Tokens are set as httpOnly cookies by backend
     */
    const login = (userData) => {
        try {
            // Store user data
            setUser(userData);
            setIsAuthenticated(true);

            // Store in localStorage for quick access
            localStorage.setItem("user", JSON.stringify(userData));

            logger.info("User logged in successfully", {
                userId: userData._id,
            });

            return true;
        } catch (error) {
            logger.error("Login handler failed:", error);
            return false;
        }
    };

    /**
     * Logout handler
     */
    const logout = () => {
        try {
            // Clear state
            setUser(null);
            setIsAuthenticated(false);

            // Clear localStorage
            localStorage.removeItem("user");

            logger.info("User logged out successfully");

            return true;
        } catch (error) {
            logger.error("Logout handler failed:", error);
            return false;
        }
    };

    /**
     * Update user data
     */
    const updateUser = (updatedData) => {
        try {
            const updatedUser = { ...user, ...updatedData };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));

            logger.info("User data updated", { userId: updatedUser._id });

            return true;
        } catch (error) {
            logger.error("Update user failed:", error);
            return false;
        }
    };

    /**
     * Check if user has specific role
     */
    const hasRole = (role) => {
        if (!user || !user.role) return false;
        return user.role === role;
    };

    /**
     * Check if user has specific permission
     */
    const hasPermission = (permission) => {
        if (!user || !user.permissions) return false;
        return user.permissions.includes(permission);
    };

    const value = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        updateUser,
        hasRole,
        hasPermission,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

export default AuthContext;
