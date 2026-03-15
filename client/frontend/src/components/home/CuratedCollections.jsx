import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TbTriangleFilled } from "react-icons/tb";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "../ui/carousel";
import { getCollections } from "../../api/collections.api";
import logger from "../../utils/logger.util";

/**
 * CuratedCollections Component
 * Displays curated collections with carousel or grid layout
 * @param {boolean} limitToFour - If true, only shows first 4 collections
 */
const CuratedCollections = ({ limitToFour = true }) => {
    const [allCollections, setAllCollections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCollections();
    }, []);

    const fetchCollections = async () => {
        try {
            setLoading(true);
            const response = await getCollections();
            setAllCollections(response.data?.data || []);
        } catch (err) {
            logger.error("Failed to fetch collections:", err);
        } finally {
            setLoading(false);
        }
    };

    // Limit collections based on toggle
    const collections = limitToFour
        ? allCollections.slice(0, 4)
        : allCollections;

    // Determine if we need carousel (more than 4 items)
    const needsCarousel = collections.length > 4;

    // Loading skeleton
    if (loading) {
        return (
            <section className="py-12 md:py-16 bg-background-primary">
                <div className="container mx-auto px-4">
                    <div className="h-8 w-48 bg-background-secondary rounded mx-auto mb-8 animate-pulse" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
                        {[...Array(4)].map((_, index) => (
                            <div
                                key={index}
                                className="bg-background-secondary rounded-sm overflow-hidden animate-pulse"
                            >
                                <div className="aspect-square bg-gray-300" />
                                <div className="pt-4 space-y-2">
                                    <div className="h-4 bg-gray-300 rounded w-2/3 mx-auto" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    // Don't render if no collections
    if (collections.length === 0) {
        return null;
    }

    return (
        <section className="py-12 md:py-16 bg-background-primary">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-8 md:mb-12">
                    <p className="text-xs md:text-sm text-text-muted uppercase tracking-widest mb-2 text-accent-2">
                        COLLECTIONS
                    </p>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-medium text-text-primary mb-4">
                        Curated for You
                    </h2>
                    <p className="text-sm md:text-base text-text-muted font-light max-w-2xl mx-auto">
                        Thoughtfully curated selections for every occasion and
                        celebration
                    </p>
                </div>

                {/* Conditional Rendering: Grid or Carousel */}
                {needsCarousel ? (
                    // Carousel for many items
                    <Carousel
                        opts={{
                            align: "start",
                            loop: false,
                        }}
                        className="relative max-w-[80vw] mx-auto"
                    >
                        <CarouselContent className="-ml-4 md:-ml-6">
                            {collections.map((collection) => (
                                <CarouselItem
                                    key={collection.name}
                                    className="pl-4 md:pl-6 basis-1/2 sm:basis-1/3 lg:basis-1/4"
                                >
                                    <CollectionCard collection={collection} />
                                </CarouselItem>
                            ))}
                        </CarouselContent>

                        {/* Previous Button */}
                        <CarouselPrevious className="absolute -left-8 sm:-left-10 lg:-left-14 top-1/2 -translate-y-1/2 transition-all duration-300 text-text-secondary-invert hover:text-accent-1 hover:scale-110 border-0 bg-transparent shadow-none">
                            <TbTriangleFilled className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 -rotate-90 drop-shadow-lg" />
                        </CarouselPrevious>

                        {/* Next Button */}
                        <CarouselNext className="absolute -right-8 sm:-right-10 lg:-right-14 top-1/2 -translate-y-1/2 transition-all duration-300 text-text-secondary-invert hover:text-accent-1 hover:scale-110 border-0 bg-transparent shadow-none">
                            <TbTriangleFilled className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rotate-90 drop-shadow-lg" />
                        </CarouselNext>
                    </Carousel>
                ) : (
                    // Centered Grid for 4 or fewer items
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 md:max-w-[80vw] mx-auto">
                        {collections.map((collection) => (
                            <CollectionCard
                                key={collection.name}
                                collection={collection}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

/**
 * CollectionCard Component
 * Individual collection card with image and name
 */
const CollectionCard = ({ collection }) => {
    // Generate slug from collection name (lowercase, replace spaces with hyphens)
    const slug = collection.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    return (
        <Link to={`/shop?collections=${slug}`} className="group block">
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden rounded-sm mb-2 bg-background-secondary">
                {/* Placeholder or default image - you can customize this */}
                <div className="w-full h-full flex items-center justify-center text-text-muted">
                    <img
                        src={`/images/collections/${slug}.jpg`}
                        alt={collection.name}
                        onError={(e) => {
                            // Fallback if image not found
                            e.target.style.display = "none";
                            e.target.parentElement.innerHTML = `<div class="flex flex-col items-center justify-center h-full"><span class="text-4xl md:text-5xl font-serif text-text-muted opacity-50">${collection.name.charAt(0)}</span></div>`;
                        }}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                </div>
            </div>

            {/* Collection Name */}
            <h3 className="text-center text-sm md:text-base font-medium text-text-primary transition-colors duration-300 group-hover:text-accent-1">
                {collection.name}
            </h3>

            {/* Product Count */}
            {/* <p className="text-center text-xs text-text-muted mt-1">
                {collection.productCount}{" "}
                {collection.productCount === 1 ? "Product" : "Products"}
            </p> */}
        </Link>
    );
};

export default CuratedCollections;
