import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Loader from "../common/Loader";

/**
 * Public Route Component
 * Prevents authenticated users from accessing public pages like login
 * Redirects to home if already logged in
 */
const PublicRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    // Show loader while checking authentication
    if (isLoading) {
        return <Loader fullScreen text="Loading..." />;
    }

    // Redirect to home if already authenticated
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // Render children if not authenticated
    return children;
};

export default PublicRoute;
