import React, { createContext, useContext, useState, useEffect } from "react";
import { getProfile, logout as logoutAPI } from "../api/auth.api";
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
     * Tokens are in httpOnly cookies, so we verify by calling /auth/profile
     */
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Always check backend for valid cookies (source of truth)
                // localStorage is just for optimization
                try {
                    const response = await getProfile();
                    const userData = response.data?.data?.user;

                    if (userData) {
                        setUser(userData);
                        setIsAuthenticated(true);
                        localStorage.setItem("user", JSON.stringify(userData));

                        logger.info("User session restored", {
                            userId: userData._id,
                        });
                    } else {
                        // No user data in response
                        setUser(null);
                        setIsAuthenticated(false);
                        localStorage.removeItem("user");
                    }
                } catch (error) {
                    // Token invalid or expired, clear data
                    logger.warn("Session validation failed:", error);
                    localStorage.removeItem("user");
                    setUser(null);
                    setIsAuthenticated(false);
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
     * Login handler (after OTP verification)
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
                phone: userData.phone,
            });

            return true;
        } catch (error) {
            logger.error("Login handler failed:", error);
            return false;
        }
    };

    /**
     * Logout handler
     * Calls backend to clear httpOnly cookies, then clears frontend state
     */
    const logout = async () => {
        try {
            // Call backend to clear cookies
            await logoutAPI();

            // Clear state
            setUser(null);
            setIsAuthenticated(false);

            // Clear localStorage
            localStorage.removeItem("user");

            logger.info("User logged out successfully");

            return true;
        } catch (error) {
            // Even if API call fails, clear frontend state
            logger.error(
                "Logout API failed, clearing frontend state anyway:",
                error,
            );

            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem("user");

            return false;
        }
    };

    /**
     * Update user profile in state
     * @param {object} updatedUser - Updated user data
     */
    const updateUser = (updatedUser) => {
        try {
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));

            logger.info("User profile updated", {
                userId: updatedUser._id,
            });

            return true;
        } catch (error) {
            logger.error("Update user failed:", error);
            return false;
        }
    };

    const value = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        updateUser,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
