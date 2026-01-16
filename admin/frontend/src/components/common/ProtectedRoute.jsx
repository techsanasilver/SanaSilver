import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Loader from "../common/Loader";

const ProtectedRoute = ({
    children,
    requireRole = null,
    requirePermission = null,
}) => {
    const { isAuthenticated, isLoading, hasRole, hasPermission } = useAuth();
    const location = useLocation();

    // Show loader while checking authentication
    if (isLoading) {
        return <Loader fullScreen text="Loading..." />;
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role requirement
    if (requireRole && !hasRole(requireRole)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Check permission requirement
    if (requirePermission && !hasPermission(requirePermission)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Render children if all checks pass
    return children;
};

export default ProtectedRoute;
