/**
 * Unauthorized Page (403)
 * Displayed when user tries to access protected route without authentication
 */

import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Unauthorized = () => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
            <div className="text-center">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                        className="w-12 h-12 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V7a4 4 0 10-8 0v4m0 0v6a2 2 0 002 2h4a2 2 0 002-2v-6H6z"
                        />
                    </svg>
                </div>

                <h1 className="text-4xl font-bold text-neutral-800 mb-4">
                    Access Denied
                </h1>
                <p className="text-neutral-600 mb-8 max-w-md mx-auto">
                    {user
                        ? "You don't have permission to access this page."
                        : "Please login to access this page."}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {user ? (
                        <>
                            <Link
                                to="/"
                                className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark"
                            >
                                Go to Homepage
                            </Link>
                            <Link
                                to="/shop"
                                className="px-6 py-3 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:border-primary hover:text-primary"
                            >
                                Browse Products
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark"
                            >
                                Login
                            </Link>
                            <Link
                                to="/"
                                className="px-6 py-3 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:border-primary hover:text-primary"
                            >
                                Go to Homepage
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
