import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";
import { useAuth } from "../context/AuthContext";
import { getProductBySlug } from "../api/products.api";
import {
    getProductReviews,
    canReview as canReviewApi,
    submitReview,
    updateReview,
    deleteReview,
} from "../api/reviews.api";
import ReviewForm from "../components/products/ReviewForm";
import Loader from "../components/common/Loader";
import logger from "../utils/logger.util";

const SORT_OPTIONS = [
    { value: "recent", label: "Most Recent" },
    { value: "highest", label: "Highest Rated" },
    { value: "lowest", label: "Lowest Rated" },
];

const REVIEWS_PER_PAGE = 20;

function StarRow({ rating, size = "sm" }) {
    const sizeClass = size === "lg" ? "text-xl" : "text-sm";
    return (
        <div className={`flex gap-0.5 ${sizeClass}`}>
            {[1, 2, 3, 4, 5].map((s) => (
                <FaStar
                    key={s}
                    className={
                        s <= rating
                            ? "text-accent-2"
                            : "text-text-secondary opacity-20"
                    }
                />
            ))}
        </div>
    );
}

const ProductReviewsPage = () => {
    const { slug } = useParams();
    const { isAuthenticated } = useAuth();

    const [product, setProduct] = useState(null);
    const [productLoading, setProductLoading] = useState(true);
    const [reviews, setReviews] = useState([]);
    const [summary, setSummary] = useState(null);
    const [pagination, setPagination] = useState(null);
    const [canReviewData, setCanReviewData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [formError, setFormError] = useState(null);
    const [sortBy, setSortBy] = useState("recent");
    const [filterRating, setFilterRating] = useState(null);
    const [page, setPage] = useState(1);

    // ── Fetch product ──────────────────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            setProductLoading(true);
            try {
                const res = await getProductBySlug(slug);
                setProduct(res.data?.data ?? null);
            } catch (err) {
                logger.error("Failed to load product for reviews page", err);
            } finally {
                setProductLoading(false);
            }
        };
        load();
    }, [slug]);

    // ── Fetch reviews ──────────────────────────────────────────────────────────
    const fetchReviews = useCallback(
        async (currentPage, currentSort, currentFilter, append = false) => {
            if (!product) return;
            try {
                const params = {
                    page: currentPage,
                    limit: REVIEWS_PER_PAGE,
                    sortBy: currentSort,
                };
                if (currentFilter) params.rating = currentFilter;

                const res = await getProductReviews(product._id, params);
                const incoming = res.data ?? [];
                const meta = res.meta ?? {};

                if (append) {
                    setReviews((prev) => [...prev, ...incoming]);
                } else {
                    setReviews(incoming);
                }
                setSummary(meta.summary ?? null);
                setPagination(meta.pagination ?? null);
            } catch (err) {
                logger.error("Failed to load reviews", err);
            }
        },
        [product],
    );

    const fetchCanReview = useCallback(async () => {
        if (!isAuthenticated || !product) {
            setCanReviewData(null);
            return;
        }
        try {
            const res = await canReviewApi(product._id);
            setCanReviewData(res.data ?? null);
        } catch (err) {
            logger.error("Failed to check can-review", err);
            setCanReviewData(null);
        }
    }, [product, isAuthenticated]);

    // Initial load after product is available
    useEffect(() => {
        if (!product) return;
        const init = async () => {
            setLoading(true);
            await Promise.all([
                fetchReviews(1, sortBy, filterRating, false),
                fetchCanReview(),
            ]);
            setLoading(false);
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product]);

    // Re-fetch reviews on sort/filter change
    useEffect(() => {
        if (!product || loading) return;
        setPage(1);
        fetchReviews(1, sortBy, filterRating, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortBy, filterRating]);

    const handleLoadMore = async () => {
        const nextPage = page + 1;
        setLoadingMore(true);
        await fetchReviews(nextPage, sortBy, filterRating, true);
        setPage(nextPage);
        setLoadingMore(false);
    };

    const handleSubmitReview = async ({ rating, title, body }) => {
        if (!product) return;
        setSubmitting(true);
        setFormError(null);
        try {
            if (editingReview) {
                await updateReview(editingReview._id, { rating, title, body });
            } else {
                await submitReview({
                    productId: product._id,
                    rating,
                    title,
                    body,
                });
            }
            setShowForm(false);
            setEditingReview(null);
            setPage(1);
            await Promise.all([
                fetchReviews(1, sortBy, filterRating, false),
                fetchCanReview(),
            ]);
        } catch (err) {
            logger.error("Failed to submit review", err);
            const message =
                err?.response?.data?.message ||
                "Failed to submit review. Please try again.";
            setFormError(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm("Are you sure you want to delete your review?"))
            return;
        setDeletingId(reviewId);
        try {
            await deleteReview(reviewId);
            setPage(1);
            await Promise.all([
                fetchReviews(1, sortBy, filterRating, false),
                fetchCanReview(),
            ]);
        } catch (err) {
            logger.error("Failed to delete review", err);
        } finally {
            setDeletingId(null);
        }
    };

    const openEditForm = (review) => {
        setEditingReview(review);
        setFormError(null);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const openNewForm = () => {
        setEditingReview(null);
        setFormError(null);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingReview(null);
        setFormError(null);
    };

    // ── Derived ────────────────────────────────────────────────────────────────
    const totalReviews = summary?.count ?? 0;
    const averageRating = summary?.average ?? 0;
    const distribution = summary?.distribution ?? {};
    const alreadyReviewed = canReviewData?.reason === "already_reviewed";
    const noDeliveredOrder = canReviewData?.reason === "no_delivered_order";
    const userCanReview = canReviewData?.canReview === true;
    const hasMore = pagination ? pagination.page < pagination.pages : false;

    // ── Infinite scroll sentinel ───────────────────────────────────────────────
    const sentinelRef = useRef(null);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0].isIntersecting &&
                    hasMore &&
                    !loadingMore &&
                    !loading
                ) {
                    handleLoadMore();
                }
            },
            { threshold: 0.1 },
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasMore, loadingMore, loading]);

    const formatDate = (dateStr) =>
        new Date(dateStr).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });

    // ── Product loading ────────────────────────────────────────────────────────
    if (productLoading) {
        return (
            <div className="min-h-screen bg-background-primary flex items-center justify-center">
                <Loader size="lg" variant="primary" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-background-primary flex flex-col items-center justify-center gap-4">
                <p className="text-text-secondary">Product not found.</p>
                <Link to="/shop" className="text-accent-1 underline text-sm">
                    Back to Shop
                </Link>
            </div>
        );
    }

    // ── Write review CTA ───────────────────────────────────────────────────────
    const renderWriteCTA = () => {
        if (showForm) return null;
        if (!isAuthenticated) {
            return (
                <Link
                    to="/login"
                    className="inline-block px-6 py-2.5 border border-text-primary text-text-primary text-xs tracking-widest uppercase hover:bg-background-secondary transition-colors"
                >
                    Sign In to Write a Review
                </Link>
            );
        }
        if (alreadyReviewed) return null;
        if (userCanReview) {
            return (
                <button
                    onClick={openNewForm}
                    className="px-6 py-2.5 bg-text-primary text-background-primary text-xs tracking-widest uppercase hover:opacity-80 transition-opacity"
                >
                    Write a Review
                </button>
            );
        }
        if (noDeliveredOrder) {
            return (
                <p className="text-text-secondary text-sm italic">
                    Only verified purchasers can review this product.
                </p>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-background-primary">
            <div className="md:max-w-[80vw] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
                {/* ── Page Header ─────────────────────────────────────────────── */}
                <div className="mb-10">
                    <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-light text-text-primary mb-1">
                        Customer Reviews
                    </h1>
                    <p className="text-text-secondary text-sm">
                        {product.name}
                    </p>
                </div>

                {/* ── Summary + Write CTA ─────────────────────────────────────── */}
                {!loading && totalReviews > 0 && (
                    <div className="bg-background-secondary rounded-sm p-6 md:p-8 mb-10">
                        <div className="flex flex-row gap-5 items-start">
                            {/* Average */}
                            <div className="text-center shrink-0">
                                <div className="text-3xl md:text-5xl font-light text-text-primary mb-1.5">
                                    {averageRating.toFixed(1)}
                                </div>
                                <StarRow
                                    rating={Math.round(averageRating)}
                                    size="sm"
                                />
                                <div className="mt-1.5 text-text-secondary text-xs">
                                    {totalReviews} review
                                    {totalReviews !== 1 ? "s" : ""}
                                </div>
                                <div className="mt-3">{renderWriteCTA()}</div>
                            </div>

                            {/* Distribution bars */}
                            <div className="flex-1 space-y-1.5 w-full">
                                {[5, 4, 3, 2, 1].map((star) => {
                                    const count = distribution[star] ?? 0;
                                    const pct =
                                        totalReviews > 0
                                            ? Math.round(
                                                  (count / totalReviews) * 100,
                                              )
                                            : 0;
                                    return (
                                        <button
                                            key={star}
                                            onClick={() =>
                                                setFilterRating((prev) =>
                                                    prev === star ? null : star,
                                                )
                                            }
                                            className={`flex items-center gap-3 w-full text-sm transition-opacity ${
                                                filterRating &&
                                                filterRating !== star
                                                    ? "opacity-40"
                                                    : ""
                                            }`}
                                        >
                                            <span className="w-3 text-text-secondary shrink-0">
                                                {star}
                                            </span>
                                            <FaStar className="text-accent-2 shrink-0 text-xs" />
                                            <div className="flex-1 h-2 bg-background-primary rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-accent-2 rounded-full transition-all"
                                                    style={{
                                                        width: `${pct}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="w-6 text-right text-text-secondary shrink-0">
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Review Form ─────────────────────────────────────────────── */}
                {showForm && (
                    <div className="border border-divider rounded-sm p-6 mb-10">
                        <h3 className="text-text-primary font-medium mb-4 text-xs tracking-widest uppercase">
                            {editingReview
                                ? "Edit Your Review"
                                : "Write a Review"}
                        </h3>
                        {formError && (
                            <p className="mb-4 text-sm text-danger">
                                {formError}
                            </p>
                        )}
                        <ReviewForm
                            initialData={editingReview}
                            onSubmit={handleSubmitReview}
                            onCancel={closeForm}
                            submitting={submitting}
                        />
                    </div>
                )}

                {/* ── Sort + filter controls ──────────────────────────────────── */}
                {!loading && totalReviews > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-2 text-sm flex-wrap">
                            <span className="text-text-secondary">Sort:</span>
                            {SORT_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setSortBy(opt.value)}
                                    className={`px-3 py-1 border rounded-full text-xs transition-colors ${
                                        sortBy === opt.value
                                            ? "border-text-primary text-text-primary bg-background-secondary"
                                            : "border-divider text-text-secondary hover:border-text-primary"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        {filterRating && (
                            <button
                                onClick={() => setFilterRating(null)}
                                className="text-xs text-accent-1 underline underline-offset-2"
                            >
                                Clear filter ({filterRating}★)
                            </button>
                        )}
                    </div>
                )}

                {/* ── Reviews list ────────────────────────────────────────────── */}
                {loading ? (
                    <div className="space-y-6">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="space-y-2 animate-pulse">
                                <div className="h-4 w-1/4 bg-background-secondary rounded" />
                                <div className="h-4 w-full bg-background-secondary rounded" />
                                <div className="h-4 w-3/4 bg-background-secondary rounded" />
                            </div>
                        ))}
                    </div>
                ) : totalReviews === 0 ? (
                    <div className="text-center py-16 border border-divider rounded-sm">
                        <div className="flex justify-center mb-3 gap-1 text-2xl">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <FaStar
                                    key={s}
                                    className="text-text-secondary opacity-20"
                                />
                            ))}
                        </div>
                        <p className="text-text-primary font-medium mb-1">
                            No reviews yet
                        </p>
                        <p className="text-text-secondary text-sm">
                            Be the first to share your experience with this
                            product.
                        </p>
                        {isAuthenticated && userCanReview && !showForm && (
                            <button
                                onClick={openNewForm}
                                className="mt-5 px-6 py-2.5 bg-text-primary text-background-primary text-xs tracking-widest uppercase hover:opacity-80 transition-opacity"
                            >
                                Be the First to Review
                            </button>
                        )}
                    </div>
                ) : reviews.length === 0 ? (
                    <p className="text-center text-text-secondary text-sm py-10">
                        No reviews match this filter.
                    </p>
                ) : (
                    <div className="space-y-0">
                        {reviews.map((review) => {
                            const isOwnReview =
                                alreadyReviewed &&
                                canReviewData?.existingReview?._id ===
                                    review._id;
                            return (
                                <div
                                    key={review._id}
                                    className={`py-6 border-b border-divider first:border-t ${
                                        isOwnReview
                                            ? "bg-background-secondary px-4 border-none"
                                            : ""
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className="font-medium text-text-primary text-sm">
                                                    {review.customerName}
                                                </span>
                                                {isOwnReview && (
                                                    <span className="text-xs bg-accent-1 text-background-primary px-2 py-0.5 rounded-full">
                                                        Your Review
                                                    </span>
                                                )}
                                                {review.isVerifiedPurchase && (
                                                    <span className="text-xs text-success font-medium">
                                                        ✓ Verified Purchase
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <StarRow
                                                    rating={review.rating}
                                                />
                                                <span className="text-text-secondary text-xs">
                                                    {formatDate(
                                                        review.createdAt,
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        {isOwnReview && !showForm && (
                                            <div className="flex gap-3 shrink-0">
                                                <button
                                                    onClick={() =>
                                                        openEditForm(review)
                                                    }
                                                    className="text-xs text-accent-1 hover:underline underline-offset-2"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDeleteReview(
                                                            review._id,
                                                        )
                                                    }
                                                    disabled={
                                                        deletingId ===
                                                        review._id
                                                    }
                                                    className="text-xs text-danger hover:underline underline-offset-2 disabled:opacity-50"
                                                >
                                                    {deletingId === review._id
                                                        ? "Deleting..."
                                                        : "Delete"}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {review.title && (
                                        <p className="font-medium text-text-primary text-sm mb-1 mt-2">
                                            {review.title}
                                        </p>
                                    )}
                                    <p className="text-text-secondary text-sm leading-relaxed mt-1">
                                        {review.body}
                                    </p>
                                </div>
                            );
                        })}

                        {/* Infinite scroll sentinel */}
                        <div
                            ref={sentinelRef}
                            className="py-6 flex justify-center"
                        >
                            {loadingMore && (
                                <Loader size="sm" variant="primary" />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductReviewsPage;
