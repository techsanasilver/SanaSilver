/**
 * Not Found Page (404)
 * Displayed when route doesn't exist
 */

import { Link } from "react-router-dom";

const NotFound = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
            <div className="text-center">
                <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
                <h2 className="text-3xl font-bold text-neutral-800 mb-4">
                    Page Not Found
                </h2>
                <p className="text-neutral-600 mb-8 max-w-md mx-auto">
                    Sorry, the page you're looking for doesn't exist or has been
                    moved.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
                </div>
            </div>
        </div>
    );
};

export default NotFound;
