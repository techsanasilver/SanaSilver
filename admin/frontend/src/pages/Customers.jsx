import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdSearch, MdFilterList, MdClear, MdRefresh } from "react-icons/md";
import { getAllCustomers } from "../api/customers.api";
import { handleApiError } from "../utils/axios";
import logger from "../utils/logger.util";
import Loader from "../components/common/Loader";
import Pagination from "../components/common/Pagination";

const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

const Customers = () => {
    const navigate = useNavigate();

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 20,
        hasNextPage: false,
        hasPrevPage: false,
    });

    const [draftFilters, setDraftFilters] = useState({
        search: "",
        isActive: "",
        sortBy: "newest",
    });

    const [appliedFilters, setAppliedFilters] = useState({
        search: "",
        isActive: "",
        sortBy: "newest",
        page: 1,
        limit: 20,
    });

    const [showFilters, setShowFilters] = useState(false);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            setError(null);

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

            logger.debug("Fetching customers with params:", params);

            const response = await getAllCustomers(params);

            if (response.success) {
                setCustomers(response.data || []);
                if (response.meta?.pagination) {
                    const p = response.meta.pagination;
                    setPagination({
                        currentPage: p.page,
                        totalPages: p.pages,
                        totalItems: p.total,
                        itemsPerPage: appliedFilters.limit,
                        hasNextPage: p.hasNext,
                        hasPrevPage: p.hasPrev,
                    });
                }
            }
        } catch (err) {
            logger.error("Error fetching customers:", err);
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, [appliedFilters]);

    const handleDraftFilterChange = (key, value) => {
        setDraftFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setAppliedFilters((prev) => ({
            ...prev,
            search: draftFilters.search,
            page: 1,
        }));
    };

    const handleApplyFilters = () => {
        setAppliedFilters((prev) => ({
            ...prev,
            ...draftFilters,
            page: 1,
        }));
        setShowFilters(false);
    };

    const clearFilters = () => {
        const cleared = { search: "", isActive: "", sortBy: "newest" };
        setDraftFilters(cleared);
        setAppliedFilters((prev) => ({
            ...cleared,
            page: 1,
            limit: prev.limit,
        }));
    };

    const handlePageChange = (newPage) => {
        setAppliedFilters((prev) => ({ ...prev, page: newPage }));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const hasActiveFilters =
        appliedFilters.search !== "" ||
        appliedFilters.isActive !== "" ||
        appliedFilters.sortBy !== "newest";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-text">Customers</h1>
                    <p className="text-text-secondary mt-1">
                        {pagination.totalItems} registered customers
                    </p>
                </div>
                <button
                    onClick={fetchCustomers}
                    className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-text-secondary hover:text-text hover:border-accent transition-colors"
                >
                    <MdRefresh className="text-lg" />
                    Refresh
                </button>
            </div>

            {/* Search + Filter Bar */}
            <div className="bg-surface rounded-lg shadow-md p-4">
                <div className="flex gap-3 flex-wrap">
                    <form
                        onSubmit={handleSearch}
                        className="flex-1 min-w-52 flex gap-2"
                    >
                        <div className="relative flex-1">
                            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-lg" />
                            <input
                                type="text"
                                placeholder="Search by name, email or phone..."
                                value={draftFilters.search}
                                onChange={(e) =>
                                    handleDraftFilterChange(
                                        "search",
                                        e.target.value,
                                    )
                                }
                                className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-text placeholder-text-secondary bg-background focus:outline-none focus:border-accent text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
                        >
                            Search
                        </button>
                    </form>

                    <button
                        onClick={() => setShowFilters((prev) => !prev)}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-colors ${
                            showFilters || hasActiveFilters
                                ? "border-accent text-accent bg-accent/5"
                                : "border-border text-text-secondary hover:border-accent hover:text-accent"
                        }`}
                    >
                        <MdFilterList />
                        Filters
                        {hasActiveFilters && (
                            <span className="w-2 h-2 rounded-full bg-accent" />
                        )}
                    </button>

                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1 px-3 py-2 text-sm text-danger hover:bg-danger/5 border border-danger/30 rounded-lg transition-colors"
                        >
                            <MdClear />
                            Clear
                        </button>
                    )}
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">
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
                                className="w-full px-3 py-2 border border-border rounded-lg text-text bg-background focus:outline-none focus:border-accent text-sm"
                            >
                                <option value="">All</option>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">
                                Sort By
                            </label>
                            <select
                                value={draftFilters.sortBy}
                                onChange={(e) =>
                                    handleDraftFilterChange(
                                        "sortBy",
                                        e.target.value,
                                    )
                                }
                                className="w-full px-3 py-2 border border-border rounded-lg text-text bg-background focus:outline-none focus:border-accent text-sm"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="name">Name (A–Z)</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={handleApplyFilters}
                                className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <Loader />
                </div>
            ) : error ? (
                <div className="bg-surface rounded-lg shadow-md p-8 text-center">
                    <p className="text-danger">{error}</p>
                    <button
                        onClick={fetchCustomers}
                        className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
                    >
                        Retry
                    </button>
                </div>
            ) : customers.length === 0 ? (
                <div className="bg-surface rounded-lg shadow-md p-8 text-center">
                    <p className="text-text-secondary">No customers found</p>
                </div>
            ) : (
                <div className="bg-surface rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-background">
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-text-secondary">
                                        Customer
                                    </th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-text-secondary">
                                        Phone
                                    </th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-text-secondary hidden md:table-cell">
                                        Email
                                    </th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-text-secondary hidden lg:table-cell">
                                        Joined
                                    </th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-text-secondary">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {customers.map((customer) => {
                                    const fullName =
                                        [customer.firstName, customer.lastName]
                                            .filter(Boolean)
                                            .join(" ") || "—";

                                    return (
                                        <tr
                                            key={customer._id}
                                            onClick={() =>
                                                navigate(
                                                    `/customers/${customer._id}`,
                                                )
                                            }
                                            className="hover:bg-background cursor-pointer transition-colors"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                        <span className="text-sm font-semibold text-primary">
                                                            {(
                                                                customer
                                                                    .firstName?.[0] ||
                                                                customer
                                                                    .phone?.[3] ||
                                                                "?"
                                                            ).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-medium text-text">
                                                        {fullName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-text-secondary">
                                                {customer.phone}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-text-secondary hidden md:table-cell">
                                                {customer.email || "—"}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-text-secondary hidden lg:table-cell">
                                                {formatDate(customer.createdAt)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                                                        customer.isActive
                                                            ? "bg-success/10 text-success"
                                                            : "bg-danger/10 text-danger"
                                                    }`}
                                                >
                                                    {customer.isActive
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-4 py-3 border-t border-border">
                        <Pagination
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={handlePageChange}
                            totalItems={pagination.totalItems}
                            itemsPerPage={pagination.itemsPerPage}
                            hasNextPage={pagination.hasNextPage}
                            hasPrevPage={pagination.hasPrevPage}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
