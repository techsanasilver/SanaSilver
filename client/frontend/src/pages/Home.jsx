/**
 * Home Page
 * Landing page with banners, featured products, categories
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Loader from "../components/common/Loader";
import logger from "../utils/logger.util";

const Home = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate initial data loading
        const timer = setTimeout(() => {
            setLoading(false);
            logger.info("Home page loaded");
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center py-20">
                <h1 className="text-5xl font-bold text-neutral-800 mb-4">
                    Welcome to Sana Silver
                </h1>
                <p className="text-xl text-neutral-600 mb-8">
                    Discover our exquisite collection of silver jewelry
                </p>
                <Link
                    to="/shop"
                    className="inline-block px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors"
                >
                    Shop Now
                </Link>
            </div>

            {/* Placeholder sections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                <div className="p-6 border border-neutral-200 rounded-lg text-center">
                    <h3 className="text-xl font-semibold mb-2">
                        Featured Categories
                    </h3>
                    <p className="text-neutral-600">
                        Explore our popular collections
                    </p>
                </div>
                <div className="p-6 border border-neutral-200 rounded-lg text-center">
                    <h3 className="text-xl font-semibold mb-2">New Arrivals</h3>
                    <p className="text-neutral-600">
                        Check out latest products
                    </p>
                </div>
                <div className="p-6 border border-neutral-200 rounded-lg text-center">
                    <h3 className="text-xl font-semibold mb-2">Best Sellers</h3>
                    <p className="text-neutral-600">Most loved by customers</p>
                </div>
            </div>
        </div>
    );
};

export default Home;
