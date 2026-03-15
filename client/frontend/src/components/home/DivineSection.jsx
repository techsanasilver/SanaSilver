import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useCategories } from "../../context/CategoryContext";
import CategoryCard from "../categories/CategoryCard";
import { TbTriangleFilled } from "react-icons/tb";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "../ui/carousel";
import logger from "../../utils/logger.util";

/**
 * DivineSection Component
 * Displays subcategories of Divine in a carousel
 */
const DivineSection = () => {
    const { getCategoryBySlug, loading } = useCategories();
    const [subcategories, setSubcategories] = useState([]);

    // Get Divine category and its subcategories
    useEffect(() => {
        if (!loading) {
            const divineCategory = getCategoryBySlug("divine");
            if (divineCategory && divineCategory.children) {
                setSubcategories(divineCategory.children);
                logger.info(
                    `Loaded ${divineCategory.children.length} divine subcategories`,
                );
            } else {
                logger.warn("Divine category not found or has no children");
            }
        }
    }, [loading, getCategoryBySlug]);

    // Loading skeleton
    if (loading) {
        return (
            <section className="py-12 md:py-16 bg-background-primary">
                <div className="container mx-auto px-4">
                    <div className="h-8 w-48 bg-background-secondary rounded mx-auto mb-8 animate-pulse" />
                    <div className="max-w-[85vw] mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {[...Array(2)].map((_, index) => (
                            <div
                                key={index}
                                className="bg-background-secondary rounded-lg overflow-hidden animate-pulse"
                            >
                                <div className="aspect-square bg-gray-300" />
                                <div className="p-4 space-y-2">
                                    <div className="h-4 bg-gray-300 rounded w-2/3 mx-auto" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    // Don't render if no subcategories
    if (subcategories.length === 0) {
        return null;
    }

    return (
        <section className="py-12 md:py-16 bg-background-primary">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-8 md:mb-12">
                    <p className="text-xs md:text-sm text-text-muted uppercase tracking-widest  text-accent-2">
                        COLLECTION
                    </p>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-medium text-text-primary my-4">
                        Divine
                    </h2>
                    <p className="text-sm md:text-base text-text-muted font-light max-w-2xl mx-auto">
                        Discover our sacred collection of divine items, crafted
                        with devotion and spiritual significance
                    </p>
                </div>

                {/* Carousel Container */}
                <Carousel
                    opts={{
                        align: "start",
                        loop: false,
                    }}
                    className="relative max-w-[80vw] mx-auto"
                >
                    <CarouselContent className="-ml-4 md:-ml-6">
                        {subcategories.map((subcategory) => (
                            <CarouselItem
                                key={subcategory._id}
                                className="pl-4 md:pl-6 basis-1/2 sm:basis-1/3 lg:basis-1/4"
                            >
                                <CategoryCard category={subcategory} />
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
            </div>
        </section>
    );
};

export default DivineSection;
