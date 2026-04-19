import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    MdSearch,
    MdFilterList,
    MdClear,
    MdRefresh,
    MdFileDownload,
} from "react-icons/md";
import { getAllOrders, getOrderStats } from "../api/orders.api";
import { handleApiError } from "../utils/axios";
import logger from "../utils/logger.util";
import Loader from "../components/common/Loader";
import Pagination from "../components/common/Pagination";

const Orders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
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

    // Separate draft filters from applied filters
    const [draftFilters, setDraftFilters] = useState({
        search: "",
        status: "",
        paymentStatus: "",
        startDate: "",
        endDate: "",
    });

    // Applied filters - these trigger API calls
    const [appliedFilters, setAppliedFilters] = useState({
        search: "",
        status: "",
        paymentStatus: "",
        startDate: "",
        endDate: "",
        page: 1,
        limit: 20,
    });

    const [showFilters, setShowFilters] = useState(false);
    const [statsPeriod, setStatsPeriod] = useState("week");

    // Order status options
    const statusOptions = [
        { value: "", label: "All Status" },
        { value: "pending", label: "Pending" },
        { value: "confirmed", label: "Confirmed" },
        { value: "processing", label: "Processing" },
        { value: "shipped", label: "Shipped" },
        { value: "delivered", label: "Delivered" },
        { value: "cancelled", label: "Cancelled" },
    ];

    // Payment status options
    const paymentStatusOptions = [
        { value: "", label: "All Payment Status" },
        { value: "pending", label: "Pending" },
        { value: "paid", label: "Paid" },
        { value: "failed", label: "Failed" },
        { value: "refunded", label: "Refunded" },
    ];

    // Fetch order statistics
    const fetchStats = async () => {
        try {
            setStatsLoading(true);
            const response = await getOrderStats(statsPeriod);
            if (response.success) {
                setStats(response.data);
            }
        } catch (err) {
            logger.error("Error fetching order stats:", err);
        } finally {
            setStatsLoading(false);
        }
    };

    // Fetch orders
    const fetchOrders = async () => {
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

            // Map frontend 'search' key to backend 'searchTerm' query param
            if (params.search) {
                params.searchTerm = params.search;
                delete params.search;
            }

            logger.debug("Fetching orders with params:", params);

            const response = await getAllOrders(params);

            if (response.success) {
                setOrders(response.data || []);
                // Map API response to pagination state structure
                if (response.meta?.pagination) {
                    setPagination({
                        currentPage: response.meta.pagination.currentPage,
                        totalPages: response.meta.pagination.totalPages,
                        totalItems: response.meta.pagination.totalOrders,
                        itemsPerPage: appliedFilters.limit,
                        hasNextPage: response.meta.pagination.hasNext,
                        hasPrevPage: response.meta.pagination.hasPrev,
                    });
                }
            }
        } catch (err) {
            logger.error("Error fetching orders:", err);
            const errorMessage = handleApiError(err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Fetch orders when appliedFilters change
    useEffect(() => {
        fetchOrders();
    }, [appliedFilters]);

    // Fetch stats when period changes
    useEffect(() => {
        fetchStats();
    }, [statsPeriod]);

    // Handle draft filter change
    const handleDraftFilterChange = (key, value) => {
        setDraftFilters((prev) => ({ ...prev, [key]: value }));
    };

    // Apply filters button
    const handleApplyFilters = () => {
        setAppliedFilters((prev) => ({
            ...prev,
            ...draftFilters,
            page: 1,
        }));
        logger.debug("Filters applied:", draftFilters);
    };

    // Handle search
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
            status: "",
            paymentStatus: "",
            startDate: "",
            endDate: "",
        };
        setDraftFilters(clearedFilters);
        setAppliedFilters((prev) => ({
            ...clearedFilters,
            page: 1,
            limit: prev.limit,
        }));
        logger.debug("Filters cleared");
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        setAppliedFilters((prev) => ({ ...prev, page: newPage }));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Get status badge color
    const getStatusColor = (status) => {
        const colors = {
            pending: "bg-warning/10 text-warning",
            confirmed: "bg-info/10 text-info",
            processing: "bg-primary/10 text-primary",
            shipped: "bg-info/10 text-info",
            delivered: "bg-success/10 text-success",
            cancelled: "bg-danger/10 text-danger",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    // Get payment status badge color
    const getPaymentStatusColor = (status) => {
        const colors = {
            pending: "bg-warning/10 text-warning",
            paid: "bg-success/10 text-success",
            failed: "bg-danger/10 text-danger",
            refunded: "bg-gray-100 text-gray-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Orders Management
                    </h1>
                    <p className="text-gray-600 mt-1">
                        View and manage all customer orders
                    </p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <MdRefresh className="text-lg" />
                    Refresh
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsLoading ? (
                    <div className="col-span-full flex justify-center py-8">
                        <Loader size="md" />
                    </div>
                ) : stats ? (
                    <>
                        {/* Total Orders */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="text-sm text-gray-600 mb-1">
                                Total Orders
                            </div>
                            <div className="text-3xl font-bold text-gray-900">
                                {stats.totalOrders || 0}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                {
                                    {
                                        today: "Today",
                                        week: "This Week",
                                        month: "This Month",
                                        all: "All Time",
                                    }[statsPeriod]
                                }
                            </div>
                        </div>

                        {/* Total Revenue */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="text-sm text-gray-600 mb-1">
                                Total Revenue
                            </div>
                            <div className="text-3xl font-bold text-success">
                                {formatCurrency(stats.totalRevenue || 0)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                Avg: {formatCurrency(stats.avgOrderValue || 0)}
                            </div>
                        </div>

                        {/* Pending Orders */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="text-sm text-gray-600 mb-1">
                                Pending Orders
                            </div>
                            <div className="text-3xl font-bold text-warning">
                                {stats.statusBreakdown?.pending || 0}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                Needs attention
                            </div>
                        </div>

                        {/* Delivered Orders */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="text-sm text-gray-600 mb-1">
                                Delivered
                            </div>
                            <div className="text-3xl font-bold text-success">
                                {stats.statusBreakdown?.delivered || 0}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                Completed successfully
                            </div>
                        </div>
                    </>
                ) : null}
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="flex-1 relative">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                        <input
                            type="text"
                            placeholder="Search by order number, customer name, or phone..."
                            value={draftFilters.search}
                            onChange={(e) =>
                                handleDraftFilterChange(
                                    "search",
                                    e.target.value,
                                )
                            }
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        Search
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <MdFilterList />
                        Filters
                    </button>
                </form>

                {/* Advanced Filters */}
                {showFilters && (
                    <div className="pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Order Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Order Status
                                </label>
                                <select
                                    value={draftFilters.status}
                                    onChange={(e) =>
                                        handleDraftFilterChange(
                                            "status",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                >
                                    {statusOptions.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Payment Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Status
                                </label>
                                <select
                                    value={draftFilters.paymentStatus}
                                    onChange={(e) =>
                                        handleDraftFilterChange(
                                            "paymentStatus",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                >
                                    {paymentStatusOptions.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={draftFilters.startDate}
                                    onChange={(e) =>
                                        handleDraftFilterChange(
                                            "startDate",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            {/* End Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={draftFilters.endDate}
                                    onChange={(e) =>
                                        handleDraftFilterChange(
                                            "endDate",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>

                        {/* Filter Actions */}
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={handleApplyFilters}
                                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                            >
                                Apply Filters
                            </button>
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <MdClear />
                                Clear All
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader size="lg" />
                    </div>
                ) : error ? (
                    <div className="p-8 text-center">
                        <p className="text-danger">{error}</p>
                        <button
                            onClick={fetchOrders}
                            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                        >
                            Retry
                        </button>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p>No orders found</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Order Details
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Payment
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orders.map((order) => (
                                        <tr
                                            key={order._id}
                                            onClick={() =>
                                                navigate(`/orders/${order._id}`)
                                            }
                                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    #{order.orderNumber}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {order.items?.length || 0}{" "}
                                                    items
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {
                                                        order.shippingAddress
                                                            ?.name
                                                    }
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {
                                                        order.shippingAddress
                                                            ?.phone
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {formatCurrency(
                                                        order.pricing?.total ||
                                                            0,
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {order.payment?.method ===
                                                    "cod"
                                                        ? "COD"
                                                        : "Online"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.payment?.status)}`}
                                                >
                                                    {order.payment?.status
                                                        ?.replace("_", " ")
                                                        .toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}
                                                >
                                                    {order.orderStatus?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {formatDate(order.createdAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <Pagination
                                currentPage={pagination.currentPage}
                                totalPages={pagination.totalPages}
                                onPageChange={handlePageChange}
                                hasNextPage={pagination.hasNextPage}
                                hasPrevPage={pagination.hasPrevPage}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Orders;
