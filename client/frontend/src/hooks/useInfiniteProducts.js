import { useState, useEffect, useCallback, useRef } from "react";
import { getProducts } from "../api/products.api";

/**
 * Custom hook for infinite scroll product loading
 * Fetches products based on filters and handles pagination
 */
const useInfiniteProducts = (filters, limit = 24) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    // Track if this is the first load
    const isFirstLoad = useRef(true);

    // Observer ref for infinite scroll
    const observerRef = useRef(null);

    /**
     * Fetch products from API
     */
    const fetchProducts = useCallback(
        async (page = 1, append = false) => {
            // Don't fetch if already loading
            if (loading || loadingMore) return;

            // Set appropriate loading state
            if (append) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }
            setError(null);

            try {
                const params = {
                    ...filters,
                    page,
                    limit,
                };

                const response = await getProducts(params);
                const apiData = response.data; // Full API response
                const productsArray = apiData.data || []; // Products are in data.data
                const pagination = apiData.meta?.pagination || {};

                if (append) {
                    // Append to existing products (infinite scroll)
                    setProducts((prev) => [...prev, ...productsArray]);
                } else {
                    // Replace products (new filter or first load)
                    setProducts(productsArray);
                }

                setTotalCount(pagination.total || 0);
                setHasMore(page < (pagination.pages || 1)); // Has more if current page < total pages
                setCurrentPage(page);
            } catch (err) {
                console.error("Error fetching products:", err);
                setError(err.message || "Failed to load products");
                setHasMore(false);
            } finally {
                setLoading(false);
                setLoadingMore(false);
                isFirstLoad.current = false;
            }
        },
        [filters, limit, loading, loadingMore],
    );

    /**
     * Load more products (next page)
     */
    const loadMore = useCallback(() => {
        if (!loading && !loadingMore && hasMore) {
            fetchProducts(currentPage + 1, true);
        }
    }, [loading, loadingMore, hasMore, currentPage, fetchProducts]);

    /**
     * Reset and fetch from page 1
     */
    const reset = useCallback(() => {
        setProducts([]);
        setCurrentPage(1);
        setHasMore(true);
        setError(null);
        fetchProducts(1, false);
    }, [fetchProducts]);

    /**
     * Effect: Fetch products when filters change
     */
    useEffect(() => {
        // Reset to page 1 when filters change
        setProducts([]);
        setCurrentPage(1);
        setHasMore(true);
        isFirstLoad.current = true;
        fetchProducts(1, false);
    }, [filters, limit]); // Intentionally using filters object

    /**
     * Intersection Observer callback for infinite scroll
     */
    const lastProductRef = useCallback(
        (node) => {
            // Don't observe if loading or no more products
            if (loading || loadingMore || !hasMore) return;

            // Disconnect previous observer
            if (observerRef.current) {
                observerRef.current.disconnect();
            }

            // Create new observer
            observerRef.current = new IntersectionObserver(
                (entries) => {
                    if (
                        entries[0].isIntersecting &&
                        hasMore &&
                        !loading &&
                        !loadingMore
                    ) {
                        loadMore();
                    }
                },
                {
                    rootMargin: "200px", // Trigger 200px before reaching the element
                },
            );

            // Observe the node
            if (node) {
                observerRef.current.observe(node);
            }
        },
        [loading, loadingMore, hasMore, loadMore],
    );

    return {
        products,
        loading,
        loadingMore,
        error,
        hasMore,
        totalCount,
        currentPage,
        loadMore,
        reset,
        lastProductRef, // Attach this ref to the last product card
        isFirstLoad: isFirstLoad.current,
    };
};

export default useInfiniteProducts;
