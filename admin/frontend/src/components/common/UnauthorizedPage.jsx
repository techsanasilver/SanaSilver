import React from "react";
import { MdLock } from "react-icons/md";
import { useNavigate } from "react-router-dom";

// Renders a full-page unauthorized message within the layout.
// Use inside a page component when a page-level permission check fails,
// so the user stays in the layout (navbar/sidebar visible) but sees this block.

const UnauthorizedPage = ({
    message = "You don't have permission to access this section.",
}) => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="w-20 h-20 bg-warning/10 rounded-full flex items-center justify-center mb-6">
                <MdLock className="w-10 h-10 text-warning" />
            </div>
            <h2 className="text-2xl font-bold text-text mb-2">Access Denied</h2>
            <p className="text-text-secondary max-w-sm mb-6">{message}</p>
            <button
                onClick={() => navigate("/")}
                className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
            >
                Go to Dashboard
            </button>
        </div>
    );
};

export default UnauthorizedPage;
