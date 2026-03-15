import { useState } from "react";
import { Link } from "react-router-dom";
import { getImageUrl } from "../../utils/image.util";

/**
 * CategoryCard Component
 * Displays a category with image, name, and hover effects
 */
const CategoryCard = ({ category }) => {
    const [isHovered, setIsHovered] = useState(false);

    // Get category image
    const categoryImage = category.image?.urls
        ? getImageUrl(category.image, "medium")
        : "/placeholder-category.jpg";

    // Build shop link using query params
    // If category has a parent, treat it as a subcategory filter; otherwise category filter
    const shopLink = category.parent
        ? `/shop?subcategory=${category.slug}`
        : `/shop?category=${category.slug}`;

    return (
        <Link
            to={shopLink}
            className="block group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden rounded-sm transition-all duration-700 group-hover:rounded-3xl bg-background-secondary mb-2">
                {/* Category Image */}
                <img
                    src={categoryImage}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
            </div>

            {/* Category Name */}
            <div className="text-center">
                <h3 className="text-sm md:text-base lg:text-lg font-medium text-text-primary mb-1 group-hover:text-accent-1 transition-colors duration-300">
                    {category.name}
                </h3>
            </div>
        </Link>
    );
};

export default CategoryCard;
