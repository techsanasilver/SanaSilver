import { useState, useEffect, useCallback } from "react";
import {
    MdCheck,
    MdClose,
    MdDelete,
    MdRefresh,
    MdFilterList,
    MdStar,
    MdRateReview,
} from "react-icons/md";
import {
    listReviews,
    approveReview,
    rejectReview,
    deleteReview,
} from "../api/reviews.api";
import { handleApiError } from "../utils/axios";
import logger from "../utils/logger.util";
import Loader from "../components/common/Loader";
import Pagination from "../components/common/Pagination";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

const StarDisplay = ({ rating }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
            <MdStar
                key={s}
                className={`text-sm ${s <= rating ? "text-accent" : "text-border"}`}
            />
        ))}
    </div>
);

const StatusBadge = ({ status }) => {
    const styles =
        status === "approved"
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700";
    return (
        <span
            className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${styles}`}
        >
            {status}
        </span>
    );
};

// ─── Reject Modal ─────────────────────────────────────────────────────────────

const RejectModal = ({ review, onConfirm, onCancel, submitting }) => {
    const [adminNote, setAdminNote] = useState("");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-text">
                        Reject Review
                    </h3>
                    <button
                        onClick={onCancel}
                        className="text-text-secondary hover:text-text"
                    >
                        <MdClose className="text-xl" />
                    </button>
                </div>

                <p className="text-sm text-text-secondary mb-3">
                    Rejecting review by{" "}
                    <span className="font-medium text-text">
                        {review.customerName}
                    </span>{" "}
                    for{" "}
                    <span className="font-medium text-text">
                        {review.product?.name ?? "—"}
                    </span>
                    .
                </p>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-text mb-1">
                        Admin Note{" "}
                        <span className="text-text-secondary font-normal">
                            (optional)
                        </span>
                    </label>
                    <textarea
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        rows={3}
                        disabled={submitting}
                        placeholder="Reason for rejection (not shown to customer)..."
                        className="w-full px-3 py-2 border border-border rounded text-sm text-text bg-background focus:outline-none focus:border-primary disabled:opacity-60 resize-none"
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => onConfirm(adminNote)}
                        disabled={submitting}
                        className="flex-1 py-2 bg-danger text-white text-sm font-medium rounded hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {submitting ? "Rejecting..." : "Reject Review"}
                    </button>
                    <button
                        onClick={onCancel}
                        disabled={submitting}
                        className="flex-1 py-2 border border-border text-text text-sm font-medium rounded hover:bg-background transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Confirm Modal ────────────────────────────────────────────────────────────

const ConfirmModal = ({
    title,
    message,
    confirmText = "Confirm",
    danger = false,
    loading = false,
    onConfirm,
    onCancel,
}) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-surface rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-text">{title}</h3>
                <button
                    onClick={onCancel}
                    disabled={loading}
                    className="text-text-secondary hover:text-text disabled:opacity-40"
                >
                    <MdClose className="text-xl" />
                </button>
            </div>
            <p className="text-sm text-text-secondary mb-5">{message}</p>
            <div className="flex gap-3">
                <button
                    onClick={onConfirm}
                    disabled={loading}
                    className={`flex-1 py-2 text-white text-sm font-medium rounded hover:opacity-90 transition-opacity disabled:opacity-50 ${
                        danger ? "bg-danger" : "bg-primary"
                    }`}
                >
                    {loading ? "Please wait..." : confirmText}
                </button>
                <button
                    onClick={onCancel}
                    disabled={loading}
                    className="flex-1 py-2 border border-border text-text text-sm font-medium rounded hover:bg-background transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
);

// ─── Alert Modal ──────────────────────────────────────────────────────────────

const AlertModal = ({ message, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-surface rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-text">Error</h3>
                <button
                    onClick={onClose}
                    className="text-text-secondary hover:text-text"
                >
                    <MdClose className="text-xl" />
                </button>
            </div>
            <p className="text-sm text-text-secondary mb-5">{message}</p>
            <button
                onClick={onClose}
                className="w-full py-2 bg-primary text-white text-sm font-medium rounded hover:opacity-90 transition-opacity"
            >
                OK
            </button>
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 20;

const SORT_OPTIONS = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "highest", label: "Highest Rated" },
    { value: "lowest", label: "Lowest Rated" },
];

const STATUS_OPTIONS = [
    { value: "", label: "All Status" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
];

const RATING_OPTIONS = [
    { value: "", label: "All Ratings" },
    { value: "5", label: "5 Stars" },
    { value: "4", label: "4 Stars" },
    { value: "3", label: "3 Stars" },
    { value: "2", label: "2 Stars" },
    { value: "1", label: "1 Star" },
];

const EMPTY_FILTERS = {
    status: "",
    rating: "",
    sortBy: "newest",
    dateFrom: "",
    dateTo: "",
};

const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: ITEMS_PER_PAGE,
        hasNextPage: false,
        hasPrevPage: false,
    });

    // Draft vs applied filters (so the user can change without firing requests)
    const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState({
        ...EMPTY_FILTERS,
        page: 1,
        limit: ITEMS_PER_PAGE,
    });

    const [showFilters, setShowFilters] = useState(false);

    // Action state
    const [actionLoading, setActionLoading] = useState(null); // reviewId
    const [rejectTarget, setRejectTarget] = useState(null); // review obj
    const [rejectSubmitting, setRejectSubmitting] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [alertDialog, setAlertDialog] = useState(null);

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchReviews = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = {};
            Object.entries(appliedFilters).forEach(([k, v]) => {
                if (v !== "" && v !== null && v !== undefined) params[k] = v;
            });

            const res = await listReviews(params);
            if (res.success) {
                setReviews(res.data ?? []);
                setSummary(res.meta?.summary ?? null);
                const p = res.meta?.pagination;
                if (p) {
                    setPagination({
                        currentPage: p.page,
                        totalPages: p.pages,
                        totalItems: p.total,
                        itemsPerPage: p.limit,
                        hasNextPage: p.page < p.pages,
                        hasPrevPage: p.page > 1,
                    });
                }
            }
        } catch (err) {
            logger.error("Failed to fetch reviews", err);
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    }, [appliedFilters]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    // ── Filter helpers ─────────────────────────────────────────────────────────
    const applyFilters = () => {
        setAppliedFilters({ ...draftFilters, page: 1, limit: ITEMS_PER_PAGE });
    };

    const clearFilters = () => {
        setDraftFilters(EMPTY_FILTERS);
        setAppliedFilters({ ...EMPTY_FILTERS, page: 1, limit: ITEMS_PER_PAGE });
    };

    const handlePageChange = (newPage) => {
        setAppliedFilters((prev) => ({ ...prev, page: newPage }));
    };

    // ── Actions ────────────────────────────────────────────────────────────────
    const handleApprove = (review) => {
        setConfirmDialog({
            title: "Approve Review",
            message: `Approve the review by "${review.customerName}"?`,
            confirmText: "Approve",
            danger: false,
            action: async () => {
                setActionLoading(review._id);
                try {
                    await approveReview(review._id);
                    await fetchReviews();
                } finally {
                    setActionLoading(null);
                }
            },
        });
    };

    const handleRejectConfirm = async (adminNote) => {
        if (!rejectTarget) return;
        setRejectSubmitting(true);
        try {
            await rejectReview(rejectTarget._id, adminNote);
            setRejectTarget(null);
            await fetchReviews();
        } catch (err) {
            logger.error("Reject failed", err);
            setAlertDialog(handleApiError(err));
        } finally {
            setRejectSubmitting(false);
        }
    };

    const handleDelete = (review) => {
        setConfirmDialog({
            title: "Delete Review",
            message: `Permanently delete the review by "${review.customerName}"? This cannot be undone.`,
            confirmText: "Delete",
            danger: true,
            action: async () => {
                setActionLoading(review._id);
                try {
                    await deleteReview(review._id);
                    await fetchReviews();
                } finally {
                    setActionLoading(null);
                }
            },
        });
    };

    const handleConfirm = async () => {
        if (!confirmDialog) return;
        setConfirmLoading(true);
        try {
            await confirmDialog.action();
            setConfirmDialog(null);
        } catch (err) {
            logger.error("Confirm action failed", err);
            setAlertDialog(handleApiError(err));
            setConfirmDialog(null);
        } finally {
            setConfirmLoading(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    const isFiltered = Object.entries(appliedFilters).some(
        ([k, v]) => !["page", "limit", "sortBy"].includes(k) && v !== "",
    );

    return (
        <div className="space-y-5">
            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <MdRateReview className="text-2xl text-primary" />
                    <div>
                        <h1 className="text-xl font-bold text-text">Reviews</h1>
                        <p className="text-text-secondary text-sm">
                            Moderate customer reviews
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFilters((p) => !p)}
                        className={`flex items-center gap-1.5 px-3 py-2 border rounded text-sm transition-colors ${
                            showFilters || isFiltered
                                ? "border-primary text-primary bg-primary/5"
                                : "border-border text-text-secondary hover:border-primary hover:text-primary"
                        }`}
                    >
                        <MdFilterList />
                        Filters{isFiltered ? " •" : ""}
                    </button>
                    <button
                        onClick={fetchReviews}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-2 border border-border text-text-secondary rounded text-sm hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                    >
                        <MdRefresh className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* ── Stats ───────────────────────────────────────────────────────── */}
            {summary && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-surface border border-border rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-text">
                            {summary.total ?? 0}
                        </p>
                        <p className="text-xs text-text-secondary mt-0.5">
                            Total
                        </p>
                    </div>
                    <div className="bg-surface border border-border rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-success">
                            {summary.approved ?? 0}
                        </p>
                        <p className="text-xs text-text-secondary mt-0.5">
                            Approved
                        </p>
                    </div>
                    <div className="bg-surface border border-border rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-danger">
                            {summary.rejected ?? 0}
                        </p>
                        <p className="text-xs text-text-secondary mt-0.5">
                            Rejected
                        </p>
                    </div>
                </div>
            )}

            {/* ── Filters ─────────────────────────────────────────────────────── */}
            {showFilters && (
                <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                                Status
                            </label>
                            <select
                                value={draftFilters.status}
                                onChange={(e) =>
                                    setDraftFilters((p) => ({
                                        ...p,
                                        status: e.target.value,
                                    }))
                                }
                                className="w-full px-2 py-1.5 border border-border rounded text-sm text-text bg-background focus:outline-none focus:border-primary"
                            >
                                {STATUS_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                                Rating
                            </label>
                            <select
                                value={draftFilters.rating}
                                onChange={(e) =>
                                    setDraftFilters((p) => ({
                                        ...p,
                                        rating: e.target.value,
                                    }))
                                }
                                className="w-full px-2 py-1.5 border border-border rounded text-sm text-text bg-background focus:outline-none focus:border-primary"
                            >
                                {RATING_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                                Sort
                            </label>
                            <select
                                value={draftFilters.sortBy}
                                onChange={(e) =>
                                    setDraftFilters((p) => ({
                                        ...p,
                                        sortBy: e.target.value,
                                    }))
                                }
                                className="w-full px-2 py-1.5 border border-border rounded text-sm text-text bg-background focus:outline-none focus:border-primary"
                            >
                                {SORT_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                                From
                            </label>
                            <input
                                type="date"
                                value={draftFilters.dateFrom}
                                onChange={(e) =>
                                    setDraftFilters((p) => ({
                                        ...p,
                                        dateFrom: e.target.value,
                                    }))
                                }
                                className="w-full px-2 py-1.5 border border-border rounded text-sm text-text bg-background focus:outline-none focus:border-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                                To
                            </label>
                            <input
                                type="date"
                                value={draftFilters.dateTo}
                                onChange={(e) =>
                                    setDraftFilters((p) => ({
                                        ...p,
                                        dateTo: e.target.value,
                                    }))
                                }
                                className="w-full px-2 py-1.5 border border-border rounded text-sm text-text bg-background focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={applyFilters}
                            className="px-4 py-1.5 bg-primary text-white text-sm rounded hover:bg-primary-dark transition-colors"
                        >
                            Apply
                        </button>
                        <button
                            onClick={clearFilters}
                            className="px-4 py-1.5 border border-border text-text-secondary text-sm rounded hover:border-primary hover:text-primary transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {/* ── Cards ───────────────────────────────────────────────────────── */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader />
                </div>
            ) : error ? (
                <div className="text-center py-16">
                    <p className="text-danger text-sm mb-3">{error}</p>
                    <button
                        onClick={fetchReviews}
                        className="text-sm text-primary underline"
                    >
                        Try again
                    </button>
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-16 bg-surface border border-border rounded-lg">
                    <MdRateReview className="text-4xl text-border mx-auto mb-3" />
                    <p className="text-text-secondary text-sm">
                        No reviews found.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {reviews.map((review) => {
                        const isActing = actionLoading === review._id;
                        return (
                            <div
                                key={review._id}
                                className={`bg-surface border rounded-lg overflow-hidden transition-opacity ${
                                    isActing ? "opacity-60" : ""
                                } ${
                                    review.status === "approved"
                                        ? "border-border"
                                        : "border-red-200"
                                }`}
                            >
                                {/* ── Product header ──────────────────── */}
                                <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
                                    {review.product?.images?.[0]?.url ? (
                                        <img
                                            src={review.product.images[0].url}
                                            alt={review.product.name}
                                            className="w-9 h-9 object-cover rounded shrink-0"
                                        />
                                    ) : (
                                        <div className="w-9 h-9 bg-background rounded shrink-0 flex items-center justify-center">
                                            <MdRateReview className="text-border" />
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-text font-semibold text-sm truncate">
                                            {review.product?.name ?? "—"}
                                        </p>
                                        <p className="text-text-secondary text-xs truncate">
                                            {review.product?.slug ?? ""}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <p className="text-xs text-text-secondary hidden sm:block">
                                            {formatDate(review.createdAt)}
                                        </p>
                                        <StatusBadge status={review.status} />
                                    </div>
                                </div>

                                {/* ── Body: customer (left) | review content (right) ── */}
                                <div className="flex divide-x divide-border">
                                    {/* Customer info */}
                                    <div className="w-52 shrink-0 px-5 py-4 space-y-1">
                                        <p className="text-text font-medium text-sm">
                                            {review.customerName}
                                        </p>
                                        {review.customer?.email && (
                                            <p className="text-text-secondary text-xs break-all">
                                                {review.customer.email}
                                            </p>
                                        )}
                                        {review.isVerifiedPurchase && (
                                            <span className="inline-block text-xs text-green-600">
                                                ✓ Verified Purchase
                                            </span>
                                        )}
                                        <div className="pt-1">
                                            <StarDisplay
                                                rating={review.rating}
                                            />
                                            <p className="text-xs text-text-secondary mt-0.5">
                                                {review.rating} / 5
                                            </p>
                                        </div>
                                        <p className="text-xs text-text-secondary sm:hidden">
                                            {formatDate(review.createdAt)}
                                        </p>
                                    </div>

                                    {/* Review content */}
                                    <div className="flex-1 px-5 py-4 space-y-2 min-w-0">
                                        {review.title && (
                                            <p className="text-text font-semibold text-sm">
                                                {review.title}
                                            </p>
                                        )}
                                        <p className="text-text-secondary text-sm leading-relaxed">
                                            {review.body}
                                        </p>
                                        {review.adminNote && (
                                            <div className="bg-red-50 border border-red-200 rounded p-2.5 mt-1">
                                                <p className="text-xs text-red-600 font-medium mb-0.5">
                                                    Admin Note
                                                </p>
                                                <p className="text-xs text-red-700">
                                                    {review.adminNote}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ── Action bar ───────────────────────── */}
                                <div className="flex items-center gap-2 px-5 py-3 bg-background border-t border-border">
                                    {review.status === "rejected" && (
                                        <button
                                            onClick={() =>
                                                handleApprove(review)
                                            }
                                            disabled={isActing}
                                            className="flex items-center gap-1.5 px-4 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-medium rounded hover:bg-green-100 transition-colors disabled:opacity-50"
                                        >
                                            <MdCheck className="text-sm" />
                                            Approve
                                        </button>
                                    )}
                                    {review.status === "approved" && (
                                        <button
                                            onClick={() =>
                                                setRejectTarget(review)
                                            }
                                            disabled={isActing}
                                            className="flex items-center gap-1.5 px-4 py-1.5 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-medium rounded hover:bg-yellow-100 transition-colors disabled:opacity-50"
                                        >
                                            <MdClose className="text-sm" />
                                            Reject
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(review)}
                                        disabled={isActing}
                                        className="flex items-center gap-1.5 px-4 py-1.5 bg-red-50 border border-red-200 text-danger text-xs font-medium rounded hover:bg-red-100 transition-colors disabled:opacity-50"
                                    >
                                        <MdDelete className="text-sm" />
                                        {isActing ? "..." : "Delete"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Pagination ───────────────────────────────────────────────────── */}
            {!loading && !error && (
                <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                    totalItems={pagination.totalItems}
                    itemsPerPage={pagination.itemsPerPage}
                    hasNextPage={pagination.hasNextPage}
                    hasPrevPage={pagination.hasPrevPage}
                />
            )}

            {/* ── Modals ───────────────────────────────────────────────────────── */}
            {rejectTarget && (
                <RejectModal
                    review={rejectTarget}
                    onConfirm={handleRejectConfirm}
                    onCancel={() => setRejectTarget(null)}
                    submitting={rejectSubmitting}
                />
            )}
            {confirmDialog && (
                <ConfirmModal
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    confirmText={confirmDialog.confirmText}
                    danger={confirmDialog.danger}
                    loading={confirmLoading}
                    onConfirm={handleConfirm}
                    onCancel={() => !confirmLoading && setConfirmDialog(null)}
                />
            )}
            {alertDialog && (
                <AlertModal
                    message={alertDialog}
                    onClose={() => setAlertDialog(null)}
                />
            )}
        </div>
    );
};

export default Reviews;
