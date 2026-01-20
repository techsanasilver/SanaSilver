import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    MdAdd,
    MdSearch,
    MdFilterList,
    MdEdit,
    MdDelete,
    MdVisibility,
    MdClear,
} from "react-icons/md";
import { getAllProducts } from "../api/products.api";
import { handleApiError } from "../utils/axios";
import logger from "../utils/logger.util";
import Loader from "../components/common/Loader";
import Pagination from "../components/common/Pagination";

const Products = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Pagination state
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 20,
        hasNextPage: false,
        hasPrevPage: false,
    });

    // Separate draft filters (user input) from applied filters (API calls)
    const [draftFilters, setDraftFilters] = useState({
        search: "",
        purity: "",
        isFeatured: "",
        isActive: "",
        gender: "",
        minPrice: "",
        maxPrice: "",
        inStock: "",
    });

    // Applied filters - these trigger API calls
    const [appliedFilters, setAppliedFilters] = useState({
        search: "",
        purity: "",
        isFeatured: "",
        isActive: "",
        gender: "",
        minPrice: "",
        maxPrice: "",
        inStock: "",
        sortBy: "newest",
        page: 1,
        limit: 20,
    });

    const [showFilters, setShowFilters] = useState(false);

    // Fetch products
    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);

            // Build query params from appliedFilters
            const params = {};
            Object.keys(appliedFilters).forEach((key) => {
                if (
                    appliedFilters[key] !== "" &&
                    appliedFilters[key] !== null &&
                    appliedFilters[key] !== undefined
                ) {
                    params[key] = appliedFilters[key];
                }
            });

            logger.debug("Fetching products with params:", params);

            const response = await getAllProducts(params);

            if (response.success) {
                setProducts(response.data || []);
                // Map API response to pagination state structure
                if (response.meta.pagination) {
                    setPagination({
                        currentPage: response.meta.pagination.page,
                        totalPages: response.meta.pagination.pages,
                        totalItems: response.meta.pagination.total,
                        itemsPerPage: response.meta.pagination.limit,
                        hasNextPage:
                            response.meta.pagination.page <
                            response.meta.pagination.pages,
                        hasPrevPage: response.meta.pagination.page > 1,
                    });
                }
            }
        } catch (err) {
            logger.error("Error fetching products:", err);
            const errorMessage = handleApiError(err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Fetch products when appliedFilters change
    useEffect(() => {
        fetchProducts();
    }, [appliedFilters]);

    // Handle draft filter change (doesn't trigger API call)
    const handleDraftFilterChange = (key, value) => {
        setDraftFilters((prev) => ({ ...prev, [key]: value }));
    };

    // Handle sort change (applies immediately)
    const handleSortChange = (value) => {
        setAppliedFilters((prev) => ({ ...prev, sortBy: value, page: 1 }));
    };

    // Apply filters button - copies draft to applied
    const handleApplyFilters = () => {
        setAppliedFilters((prev) => ({
            ...prev,
            ...draftFilters,
            page: 1, // Reset to first page
        }));
        logger.debug("Filters applied:", draftFilters);
    };

    // Handle search (button or Enter key)
    const handleSearch = (e) => {
        e.preventDefault();
        setAppliedFilters((prev) => ({
            ...prev,
            search: draftFilters.search,
            page: 1,
        }));
        logger.debug("Search applied:", draftFilters.search);
    };

    // Clear all filters
    const clearFilters = () => {
        const clearedFilters = {
            search: "",
            purity: "",
            isFeatured: "",
            isActive: "",
            gender: "",
            minPrice: "",
            maxPrice: "",
            inStock: "",
        };
        setDraftFilters(clearedFilters);
        setAppliedFilters({
            ...clearedFilters,
            sortBy: "newest",
            page: 1,
            limit: 20,
        });
        logger.debug("Filters cleared");
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setAppliedFilters((prev) => ({ ...prev, page: newPage }));
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    // Format price
    const formatPrice = (price) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(price);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text">Products</h1>
                    <p className="text-text-secondary mt-1">
                        Manage your product catalog
                    </p>
                </div>
                <Link
                    to="/products/add"
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
                >
                    <MdAdd size={20} />
                    Add Product
                </Link>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-surface rounded-lg shadow-md p-4 space-y-4">
                {/* Search and Toggle Filters */}
                <div className="flex gap-4">
                    <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                        <div className="flex-1 relative">
                            <MdSearch
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                                size={20}
                            />
                            <input
                                type="text"
                                placeholder="Search products by name, description..."
                                value={draftFilters.search}
                                onChange={(e) =>
                                    handleDraftFilterChange(
                                        "search",
                                        e.target.value,
                                    )
                                }
                                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
                        >
                            Search
                        </button>
                    </form>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 bg-surface border border-border px-4 py-2 rounded-lg hover:bg-background transition-colors"
                    >
                        <MdFilterList size={20} />
                        Filters
                    </button>

                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-2 bg-surface border border-border px-4 py-2 rounded-lg hover:bg-background transition-colors"
                    >
                        <MdClear size={20} />
                        Clear
                    </button>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border">
                        {/* Purity */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Purity
                            </label>
                            <select
                                value={draftFilters.purity}
                                onChange={(e) =>
                                    handleDraftFilterChange(
                                        "purity",
                                        e.target.value,
                                    )
                                }
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">All</option>
                                <option value="925">
                                    925 (Sterling Silver)
                                </option>
                                <option value="999">999 (Pure Silver)</option>
                            </select>
                        </div>

                        {/* Gender */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Gender
                            </label>
                            <select
                                value={draftFilters.gender}
                                onChange={(e) =>
                                    handleDraftFilterChange(
                                        "gender",
                                        e.target.value,
                                    )
                                }
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">All</option>
                                <option value="men">Men</option>
                                <option value="women">Women</option>
                                <option value="unisex">Unisex</option>
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Status
                            </label>
                            <select
                                value={draftFilters.isActive}
                                onChange={(e) =>
                                    handleDraftFilterChange(
                                        "isActive",
                                        e.target.value,
                                    )
                                }
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">All</option>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                        </div>

                        {/* Featured */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Featured
                            </label>
                            <select
                                value={draftFilters.isFeatured}
                                onChange={(e) =>
                                    handleDraftFilterChange(
                                        "isFeatured",
                                        e.target.value,
                                    )
                                }
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">All</option>
                                <option value="true">Featured</option>
                                <option value="false">Not Featured</option>
                            </select>
                        </div>

                        {/* Min Price */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Min Price
                            </label>
                            <input
                                type="number"
                                placeholder="₹0"
                                value={draftFilters.minPrice}
                                onChange={(e) =>
                                    handleDraftFilterChange(
                                        "minPrice",
                                        e.target.value,
                                    )
                                }
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        {/* Max Price */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Max Price
                            </label>
                            <input
                                type="number"
                                placeholder="₹999999"
                                value={draftFilters.maxPrice}
                                onChange={(e) =>
                                    handleDraftFilterChange(
                                        "maxPrice",
                                        e.target.value,
                                    )
                                }
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        {/* Stock */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Stock
                            </label>
                            <select
                                value={draftFilters.inStock}
                                onChange={(e) =>
                                    handleDraftFilterChange(
                                        "inStock",
                                        e.target.value,
                                    )
                                }
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">All</option>
                                <option value="true">In Stock</option>
                                <option value="false">Out of Stock</option>
                            </select>
                        </div>

                        {/* Sort */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Sort By
                            </label>
                            <select
                                value={appliedFilters.sortBy}
                                onChange={(e) =>
                                    handleSortChange(e.target.value)
                                }
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="name-asc">Name (A-Z)</option>
                                <option value="name-desc">Name (Z-A)</option>
                                <option value="price-asc">
                                    Price (Low to High)
                                </option>
                                <option value="price-desc">
                                    Price (High to Low)
                                </option>
                                <option value="rating">Highest Rated</option>
                                <option value="featured">Featured First</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Apply Filters Button */}
                {showFilters && (
                    <div className="pt-4 border-t border-border flex justify-end gap-2">
                        <button
                            onClick={handleApplyFilters}
                            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
                        >
                            Apply Filters
                        </button>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-danger/5 border border-danger text-danger px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Products Table */}
            <div className="bg-surface rounded-lg shadow-md overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader />
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-text-secondary text-lg">
                            No products found.
                        </p>
                        <p className="text-text-secondary text-lg">
                            Try adjusting your filters.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-background border-b border-border">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                            Product
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                            Price Range
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                            Stock
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {products.map((product) => (
                                        <tr
                                            key={product._id}
                                            onClick={() =>
                                                navigate(
                                                    `/products/${product._id}`,
                                                )
                                            }
                                            className="hover:bg-background transition-colors cursor-pointer"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={
                                                            product.images?.[0]
                                                                ?.url ||
                                                            "/placeholder.png"
                                                        }
                                                        alt={product.name}
                                                        className="w-12 h-12 rounded-lg object-cover"
                                                    />
                                                    <div>
                                                        <div className="font-medium text-text">
                                                            {product.name}
                                                        </div>
                                                        <div className="text-sm text-text-secondary">
                                                            {product.variants
                                                                ?.length ||
                                                                0}{" "}
                                                            variants
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-text">
                                                    {product.category?.name ||
                                                        "N/A"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-text">
                                                    {formatPrice(
                                                        product.minPrice,
                                                    )}{" "}
                                                    -{" "}
                                                    {formatPrice(
                                                        product.maxPrice,
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`text-sm font-medium ${
                                                        product.totalStock > 0
                                                            ? "text-success"
                                                            : "text-danger"
                                                    }`}
                                                >
                                                    {product.totalStock || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`text-sm font-medium ${
                                                        product.isActive
                                                            ? "text-success"
                                                            : "text-danger"
                                                    }`}
                                                >
                                                    {product.isActive
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <Pagination
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            totalItems={pagination.totalItems}
                            itemsPerPage={pagination.itemsPerPage}
                            hasNextPage={pagination.hasNextPage}
                            hasPrevPage={pagination.hasPrevPage}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default Products;
