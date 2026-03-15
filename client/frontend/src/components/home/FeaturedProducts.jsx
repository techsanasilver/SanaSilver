import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../products/ProductCard";
import { getProducts } from "../../api/products.api";
import logger from "../../utils/logger.util";

/**
 * FeaturedProducts Component
 * Displays featured products in responsive grid
 * Desktop: 4x2, Tablet: 3x2, Mobile: 2x2
 */
const FeaturedProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchFeaturedProducts();
    }, []);

    const fetchFeaturedProducts = async () => {
        try {
            setLoading(true);
            const response = await getProducts({
                isFeatured: true,
                isActive: true,
                limit: 8, // 4x2 for desktop
                sortBy: "newest", // Newest first
            });

            setProducts(response.data?.data || []);
        } catch (err) {
            logger.error("Failed to fetch featured products:", err);
            setError("Failed to load featured products");
        } finally {
            setLoading(false);
        }
    };

    // Loading skeleton
    if (loading) {
        return (
            <section className="py-12 md:py-16 bg-background-primary">
                <div className="container mx-auto px-4">
                    {/* Section Header Skeleton */}
                    <div className="text-center mb-8 md:mb-12">
                        <div className="h-4 w-24 bg-background-secondary rounded mx-auto mb-4 animate-pulse" />
                        <div className="h-8 w-64 bg-background-secondary rounded mx-auto mb-4 animate-pulse" />
                        <div className="h-4 w-96 bg-background-secondary rounded mx-auto animate-pulse" />
                    </div>

                    {/* Product Grid Skeleton */}
                    <div className="max-w-[80vw] mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {[...Array(8)].map((_, index) => (
                            <div
                                key={index}
                                className={`
                                    bg-background-secondary rounded-lg overflow-hidden animate-pulse
                                    ${index >= 4 ? "hidden md:block" : ""}
                                    ${index >= 6 ? "md:hidden lg:block" : ""}
                                `}
                            >
                                <div className="aspect-square bg-gray-300" />
                                <div className="p-4 space-y-3">
                                    <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto" />
                                    <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto" />
                                    <div className="h-5 bg-gray-300 rounded w-1/3 mx-auto" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    // Error state
    // if (error) {
    //     return (
    //         <section className="py-12 md:py-16 bg-background-primary">
    //             <div className="container mx-auto px-4 text-center">
    //                 <p className="text-danger">{error}</p>
    //                 {/* <button
    //                     onClick={fetchFeaturedProducts}
    //                     className="mt-4 px-6 py-2 bg-accent-1 text-white rounded hover:bg-accent-2 transition-colors"
    //                 >
    //                     Try Again
    //                 </button> */}
    //             </div>
    //         </section>
    //     );
    // }

    // No products found
    if (!products || products.length === 0) {
        return null;
    }

    return (
        <section className="py-12 md:py-16 mt-12 md:mt-16 bg-background-primary">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-8 md:mb-12">
                    <p className="text-xs md:text-sm text-text-muted uppercase tracking-widest mb-2 text-accent-2">
                        FEATURED
                    </p>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-medium text-text-primary mb-4">
                        Signature Pieces
                    </h2>
                    <p className="text-sm md:text-base text-text-muted font-light max-w-2xl mx-auto">
                        Handpicked selections from our latest collection,
                        crafted with precision and passion
                    </p>
                </div>

                {/* Product Grid */}
                <div className="lg:max-w-[80vw] mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {products.map((product, index) => (
                        <div
                            key={product._id}
                            className={`
                                ${index >= 4 ? "hidden md:block" : ""}
                                ${index >= 6 ? "md:hidden lg:block" : ""}
                            `}
                        >
                            <ProductCard product={product} showBadge={true} />
                        </div>
                    ))}
                </div>

                {/* View All Button */}
                <div className="text-center mt-8 md:mt-12">
                    <Link
                        to="/shop?featured=true"
                        className="inline-block px-8 py-3 rounded-sm bg-text-primary text-white font-medium tracking-wider hover:bg-accent-1 transition-colors duration-300"
                    >
                        VIEW ALL
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default FeaturedProducts;
