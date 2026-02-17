import { createContext, useContext, useState, useEffect } from "react";
import { getCategoryTree } from "../api/categories.api";
import logger from "../utils/logger.util";

const CategoryContext = createContext();

/**
 * Category Context Provider
 * Caches category tree to avoid repeated API calls
 * Categories are loaded once on app initialization
 */
export const CategoryProvider = ({ children }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastFetched, setLastFetched] = useState(null);

    // Cache duration: 1 hour (in milliseconds)
    const CACHE_DURATION = 60 * 60 * 1000;

    /**
     * Fetch categories from API
     */
    const fetchCategories = async (force = false) => {
        // Skip if cache is still valid and not forcing refresh
        if (
            !force &&
            lastFetched &&
            Date.now() - lastFetched < CACHE_DURATION
        ) {
            logger.info("Using cached categories");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            logger.info("Fetching category tree...");

            const response = await getCategoryTree();
            const categoryData =
                response.data?.data || response.data?.categories || [];

            setCategories(categoryData);
            setLastFetched(Date.now());
            logger.info(
                `Category tree loaded: ${categoryData.length} categories`,
            );
        } catch (err) {
            logger.error("Failed to fetch categories:", err);
            setError(err.message || "Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    /**
     * Force refresh categories (for manual refresh)
     */
    const refreshCategories = () => {
        logger.info("Force refreshing categories...");
        return fetchCategories(true);
    };

    /**
     * Get category by ID from cached data
     */
    const getCategoryById = (categoryId) => {
        const findInTree = (cats) => {
            for (const cat of cats) {
                if (cat._id === categoryId) return cat;
                if (cat.children && cat.children.length > 0) {
                    const found = findInTree(cat.children);
                    if (found) return found;
                }
            }
            return null;
        };
        return findInTree(categories);
    };

    /**
     * Get category by slug from cached data
     */
    const getCategoryBySlug = (slug) => {
        const findInTree = (cats) => {
            for (const cat of cats) {
                if (cat.slug === slug) return cat;
                if (cat.children && cat.children.length > 0) {
                    const found = findInTree(cat.children);
                    if (found) return found;
                }
            }
            return null;
        };
        return findInTree(categories);
    };

    /**
     * Get all categories as flat array (for dropdowns, filters)
     */
    const getFlatCategories = () => {
        const flattenTree = (cats, result = []) => {
            for (const cat of cats) {
                result.push(cat);
                if (cat.children && cat.children.length > 0) {
                    flattenTree(cat.children, result);
                }
            }
            return result;
        };
        return flattenTree(categories);
    };

    // Fetch categories on mount
    useEffect(() => {
        fetchCategories();
    }, []);

    const value = {
        categories, // Hierarchical tree
        loading,
        error,
        lastFetched,
        refreshCategories,
        getCategoryById,
        getCategoryBySlug,
        getFlatCategories,
    };

    return (
        <CategoryContext.Provider value={value}>
            {children}
        </CategoryContext.Provider>
    );
};

/**
 * Hook to use category context
 */
export const useCategories = () => {
    const context = useContext(CategoryContext);
    if (!context) {
        throw new Error("useCategories must be used within CategoryProvider");
    }
    return context;
};

export default CategoryContext;
