/**
 * Shop Page
 * Product listing with filters, search, sorting
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Loader from "../components/common/Loader";
import logger from "../utils/logger.util";

const Shop = () => {
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get query params
        const category = searchParams.get("category");
        const search = searchParams.get("search");

        logger.info("Shop page loaded", { category, search });

        // Simulate loading
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, [searchParams]);

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Filters Sidebar */}
                <aside className="lg:w-64">
                    <div className="p-6 border border-neutral-200 rounded-lg">
                        <h2 className="text-lg font-semibold mb-4">Filters</h2>
                        <p className="text-sm text-neutral-600">
                            Category, price, and other filters will appear here
                        </p>
                    </div>
                </aside>

                {/* Products Grid */}
                <main className="flex-1">
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="text-2xl font-bold">All Products</h1>
                        <div className="text-sm text-neutral-600">
                            Sort by: Featured
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((item) => (
                            <div
                                key={item}
                                className="border border-neutral-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                            >
                                <div className="aspect-square bg-neutral-100 rounded mb-3"></div>
                                <h3 className="font-medium mb-1">
                                    Product {item}
                                </h3>
                                <p className="text-sm text-neutral-600 mb-2">
                                    Sample description
                                </p>
                                <p className="text-lg font-bold text-primary">
                                    ₹{1000 + item * 100}
                                </p>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Shop;
