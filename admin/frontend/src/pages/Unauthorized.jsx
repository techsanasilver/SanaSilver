/**
 * Unauthorized Page
 * Displayed when user doesn't have permission to access a route
 */

import React from "react";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="max-w-md w-full text-center">
                <div className="mb-6">
                    <div className="w-20 h-20 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-10 h-10 text-warning"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-text mb-2">403</h1>
                    <h2 className="text-2xl font-semibold text-text mb-4">
                        Access Denied
                    </h2>
                    <p className="text-text-secondary">
                        You don't have permission to access this page. Please
                        contact your administrator if you believe this is an
                        error.
                    </p>
                </div>

                <button
                    onClick={() => navigate("/")}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                    Go to Home
                </button>
            </div>
        </div>
    );
};

export default Unauthorized;
