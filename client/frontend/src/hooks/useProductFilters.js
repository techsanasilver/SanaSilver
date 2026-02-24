import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";

/**
 * Custom hook to manage product filters via URL query parameters
 * Provides centralized filter state management with URL sync
 */
const useProductFilters = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    /**
     * Parse current filters from URL
     */
    const filters = useMemo(() => {
        const params = {};

        // Single value filters
        const search = searchParams.get("search");
        const sortBy = searchParams.get("sortBy");
        const page = searchParams.get("page");
        const category = searchParams.get("category");
        const purity = searchParams.get("purity");

        // Multi-value filters (comma-separated)
        const subcategory = searchParams.get("subcategory");
        const gender = searchParams.get("gender");
        const collections = searchParams.get("collections");
        const gemstone = searchParams.get("gemstone");
        const occasion = searchParams.get("occasion");
        const plating = searchParams.get("plating");

        // Range filters
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");

        // Boolean filters
        const inStock = searchParams.get("inStock");
        const onSale = searchParams.get("onSale");
        const newArrivals = searchParams.get("newArrivals");
        const customizable = searchParams.get("customizable");
        const isFeatured = searchParams.get("isFeatured");
        const isBestSeller = searchParams.get("isBestSeller");

        // Assign single values
        if (search) params.search = search;
        if (sortBy) params.sortBy = sortBy;
        if (page) params.page = parseInt(page, 10);
        if (category) params.category = category.toLowerCase();
        if (purity) params.purity = purity;

        // Assign multi-values (convert to arrays and lowercase)
        if (subcategory)
            params.subcategory = subcategory
                .split(",")
                .map((s) => s.toLowerCase());
        if (gender)
            params.gender = gender.split(",").map((g) => g.toLowerCase());
        if (collections)
            params.collections = collections
                .split(",")
                .map((c) => c.toLowerCase());
        if (gemstone)
            params.gemstone = gemstone.split(",").map((g) => g.toLowerCase());
        if (occasion)
            params.occasion = occasion.split(",").map((o) => o.toLowerCase());
        if (plating)
            params.plating = plating.split(",").map((p) => p.toLowerCase());

        // Assign range values
        if (minPrice) params.minPrice = parseFloat(minPrice);
        if (maxPrice) params.maxPrice = parseFloat(maxPrice);

        // Assign booleans
        if (inStock === "true") params.inStock = true;
        if (onSale === "true") params.onSale = true;
        if (newArrivals === "true") params.newArrivals = true;
        if (customizable === "true") params.customizable = true;
        if (isFeatured === "true") params.isFeatured = true;
        if (isBestSeller === "true") params.isBestSeller = true;

        return params;
    }, [searchParams]);

    /**
     * Update a single filter
     */
    const setFilter = useCallback(
        (key, value) => {
            const newParams = new URLSearchParams(searchParams);

            if (value === null || value === undefined || value === "") {
                // Remove filter if value is empty
                newParams.delete(key);
            } else if (Array.isArray(value)) {
                // Handle array values (multi-select) - convert to lowercase
                if (value.length === 0) {
                    newParams.delete(key);
                } else {
                    newParams.set(
                        key,
                        value.map((v) => v.toString().toLowerCase()).join(","),
                    );
                }
            } else {
                // Handle single values - convert to lowercase
                newParams.set(key, value.toString().toLowerCase());
            }

            // Reset to page 1 when filters change (except when changing page itself)
            if (key !== "page") {
                newParams.delete("page");
            }

            setSearchParams(newParams);
        },
        [searchParams, setSearchParams],
    );

    /**
     * Update multiple filters at once
     */
    const setFilters = useCallback(
        (filtersObj) => {
            const newParams = new URLSearchParams(searchParams);

            Object.entries(filtersObj).forEach(([key, value]) => {
                if (value === null || value === undefined || value === "") {
                    newParams.delete(key);
                } else if (Array.isArray(value)) {
                    if (value.length === 0) {
                        newParams.delete(key);
                    } else {
                        newParams.set(
                            key,
                            value
                                .map((v) => v.toString().toLowerCase())
                                .join(","),
                        );
                    }
                } else {
                    newParams.set(key, value.toString().toLowerCase());
                }
            });

            // Reset to page 1 when filters change
            if (!filtersObj.page) {
                newParams.delete("page");
            }

            setSearchParams(newParams);
        },
        [searchParams, setSearchParams],
    );

    /**
     * Clear a specific filter
     */
    const clearFilter = useCallback(
        (key) => {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete(key);
            newParams.delete("page"); // Reset pagination
            setSearchParams(newParams);
        },
        [searchParams, setSearchParams],
    );

    /**
     * Clear all filters
     */
    const clearAllFilters = useCallback(() => {
        setSearchParams({});
    }, [setSearchParams]);

    /**
     * Check if any filters are active (excluding page and sortBy)
     */
    const hasActiveFilters = useMemo(() => {
        const params = Array.from(searchParams.keys());
        return params.some(
            (key) => key !== "page" && key !== "sortBy" && key !== "limit",
        );
    }, [searchParams]);

    /**
     * Get active filter count (excluding page and sortBy)
     */
    const activeFilterCount = useMemo(() => {
        const params = Array.from(searchParams.keys());
        return params.filter(
            (key) => key !== "page" && key !== "sortBy" && key !== "limit",
        ).length;
    }, [searchParams]);

    /**
     * Get array of active filters for display (chips)
     */
    const activeFilters = useMemo(() => {
        const active = [];
        const params = Object.entries(filters);

        params.forEach(([key, value]) => {
            // Skip page and sortBy
            if (key === "page" || key === "sortBy") return;

            // Handle different filter types
            if (Array.isArray(value)) {
                value.forEach((v) => {
                    active.push({
                        key,
                        value: v,
                        label: formatFilterLabel(key, v),
                    });
                });
            } else {
                active.push({
                    key,
                    value,
                    label: formatFilterLabel(key, value),
                });
            }
        });

        return active;
    }, [filters]);

    return {
        filters,
        setFilter,
        setFilters,
        clearFilter,
        clearAllFilters,
        hasActiveFilters,
        activeFilterCount,
        activeFilters,
    };
};

/**
 * Helper function to format filter labels for display
 */
const formatFilterLabel = (key, value) => {
    const labels = {
        category: "Category",
        subcategory: "Subcategory",
        collections: "Collection",
        gender: "Gender",
        purity: "Purity",
        gemstone: "Gemstone",
        occasion: "Occasion",
        plating: "Plating",
        search: "Search",
        inStock: "In Stock",
        onSale: "On Sale",
        newArrivals: "New Arrivals",
        customizable: "Customizable",
        isFeatured: "Featured",
        isBestSeller: "Best Seller",
        minPrice: "Min Price",
        maxPrice: "Max Price",
    };

    const labelPrefix = labels[key] || key;

    // Handle price range
    if (key === "minPrice" || key === "maxPrice") {
        return `${labelPrefix}: ₹${value}`;
    }

    // Handle booleans
    if (typeof value === "boolean") {
        return labelPrefix;
    }

    // Capitalize first letter of value
    const formattedValue =
        typeof value === "string"
            ? value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, " ")
            : value;

    return `${labelPrefix}: ${formattedValue}`;
};

export default useProductFilters;
