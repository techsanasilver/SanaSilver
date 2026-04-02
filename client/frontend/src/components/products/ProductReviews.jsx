import { useState, useEffect, useCallback } from "react";
import { FaStar } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
    getProductReviews,
    canReview as canReviewApi,
    submitReview,
    updateReview,
    deleteReview,
} from "../../api/reviews.api";
import ReviewForm from "./ReviewForm";
import logger from "../../utils/logger.util";

const PREVIEW_LIMIT = 4;

function StarRow({ rating }) {
    return (
        <div className="flex gap-0.5 text-sm">
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

const ProductReviews = ({ productId, productSlug }) => {
    const { isAuthenticated } = useAuth();

    const [reviews, setReviews] = useState([]);
    const [summary, setSummary] = useState(null);
    const [canReviewData, setCanReviewData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [formError, setFormError] = useState(null);

    const fetchReviews = useCallback(async () => {
        try {
            const res = await getProductReviews(productId, {
                page: 1,
                limit: PREVIEW_LIMIT,
                sortBy: "recent",
            });
            setReviews(res.data ?? []);
            setSummary(res.meta?.summary ?? null);
        } catch (err) {
            logger.error("Failed to load reviews", err);
        }
    }, [productId]);

    const fetchCanReview = useCallback(async () => {
        if (!isAuthenticated) {
            setCanReviewData(null);
            return;
        }
        try {
            const res = await canReviewApi(productId);
            setCanReviewData(res.data ?? null);
        } catch (err) {
            logger.error("Failed to check can-review", err);
            setCanReviewData(null);
        }
    }, [productId, isAuthenticated]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchReviews(), fetchCanReview()]);
            setLoading(false);
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId]);

    const handleSubmitReview = async ({ rating, title, body }) => {
        setSubmitting(true);
        setFormError(null);
        try {
            if (editingReview) {
                await updateReview(editingReview._id, { rating, title, body });
            } else {
                await submitReview({ productId, rating, title, body });
            }
            setShowForm(false);
            setEditingReview(null);
            await Promise.all([fetchReviews(), fetchCanReview()]);
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
            await Promise.all([fetchReviews(), fetchCanReview()]);
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
    };

    const openNewForm = () => {
        setEditingReview(null);
        setFormError(null);
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingReview(null);
        setFormError(null);
    };

    // ── Derived ────────────────────────────────────────────────────────────────
    const totalReviews = summary?.count ?? 0;
    const averageRating = summary?.average ?? 0;
    const alreadyReviewed = canReviewData?.reason === "already_reviewed";
    const noDeliveredOrder = canReviewData?.reason === "no_delivered_order";
    const userCanReview = canReviewData?.canReview === true;

    const formatDate = (dateStr) =>
        new Date(dateStr).toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
        });

    // ── Skeleton ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div>
                <div className="text-center mb-10">
                    <div className="h-9 w-56 bg-background-secondary rounded animate-pulse mx-auto mb-3" />
                    <div className="h-4 w-44 bg-background-secondary rounded animate-pulse mx-auto" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="bg-background-secondary rounded-sm p-5 space-y-3 animate-pulse"
                        >
                            <div className="h-4 w-20 bg-divider rounded" />
                            <div className="h-14 w-full bg-divider rounded" />
                            <div className="h-px bg-divider" />
                            <div className="h-4 w-24 bg-divider rounded" />
                            <div className="h-3 w-16 bg-divider rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ── Write review CTA ───────────────────────────────────────────────────────
    const renderWriteCTA = () => {
        if (showForm) return null;
        if (!isAuthenticated) {
            return (
                <div className="text-center mb-8">
                    <Link
                        to="/login"
                        className="inline-block px-6 py-2.5 border border-text-primary text-text-primary text-xs tracking-widest uppercase hover:bg-background-secondary transition-colors"
                    >
                        Sign In to Write a Review
                    </Link>
                </div>
            );
        }
        if (alreadyReviewed) return null;
        if (userCanReview) {
            return (
                <div className="text-center mb-8">
                    <button
                        onClick={openNewForm}
                        className="px-6 py-2.5 bg-text-primary text-background-primary text-xs tracking-widest uppercase hover:opacity-80 transition-opacity"
                    >
                        Write a Review
                    </button>
                </div>
            );
        }
        if (noDeliveredOrder) {
            return (
                <p className="text-center text-text-secondary text-sm italic mb-8">
                    Only verified purchasers can review this product.
                </p>
            );
        }
        return null;
    };

    return (
        <div>
            {/* ── Section Header ────────────────────────────────────────────────── */}
            <div className="text-center mb-8">
                <h2 className="font-display text-3xl xl:text-4xl font-light text-text-primary mb-2">
                    Customer Reviews
                </h2>
                {totalReviews > 0 && (
                    <p className="text-text-secondary text-sm inline-flex items-center gap-1.5">
                        <span>{averageRating.toFixed(1)}</span>
                        <FaStar className="text-accent-2 text-xs" />
                        <span>
                            based on {totalReviews} review
                            {totalReviews !== 1 ? "s" : ""}
                        </span>
                    </p>
                )}
            </div>

            {/* ── Review Form ───────────────────────────────────────────────────── */}
            {showForm && (
                <div className="border border-divider rounded-sm p-6 mb-8 mx-auto">
                    <h3 className="text-text-primary font-medium mb-4 text-xs tracking-widest uppercase">
                        {editingReview ? "Edit Your Review" : "Write a Review"}
                    </h3>
                    {formError && (
                        <p className="mb-4 text-sm text-danger">{formError}</p>
                    )}
                    <ReviewForm
                        initialData={editingReview}
                        onSubmit={handleSubmitReview}
                        onCancel={closeForm}
                        submitting={submitting}
                    />
                </div>
            )}

            {/* ── Review Cards / Empty State ─────────────────────────────────────── */}
            {totalReviews === 0 ? (
                <div className="text-center py-14 border border-divider rounded-sm">
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
                        Be the first to share your experience.
                    </p>
                    {isAuthenticated && userCanReview && !showForm && (
                        <button
                            onClick={openNewForm}
                            className="mt-5 px-6 py-2.5 bg-text-primary text-background-primary text-xs tracking-widest uppercase hover:opacity-80 transition-opacity"
                        >
                            Be the First to Review
                        </button>
                    )}
                    {isAuthenticated && noDeliveredOrder && !showForm && (
                        <p className="mt-4 text-text-secondary text-sm italic">
                            Only customers with a delivered order can review
                            this product.
                        </p>
                    )}
                </div>
            ) : (
                <>
                    {/* Card grid */}
                    <div className="flex flex-wrap justify-center gap-5">
                        {reviews.map((review) => {
                            const isOwnReview =
                                alreadyReviewed &&
                                canReviewData?.existingReview?._id ===
                                    review._id;
                            return (
                                <div
                                    key={review._id}
                                    className={`w-full sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)] bg-background-secondary rounded-sm p-5 pt-10 flex flex-col ${
                                        isOwnReview
                                            ? "ring-1 ring-accent-1"
                                            : ""
                                    }`}
                                >
                                    <StarRow rating={review.rating} />

                                    <p className="mt-3 text-text-secondary text-sm italic leading-relaxed flex-1 line-clamp-5">
                                        &ldquo;
                                        {review.title
                                            ? `${review.title}. ${review.body}`
                                            : review.body}
                                        &rdquo;
                                    </p>

                                    <div className="border-t border-divider mt-4 pt-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-text-primary text-sm font-medium">
                                                    {review.customerName}
                                                </p>
                                                <p className="text-text-secondary text-xs mt-0.5">
                                                    {formatDate(
                                                        review.createdAt,
                                                    )}
                                                </p>
                                            </div>
                                            {isOwnReview && !showForm && (
                                                <div className="flex gap-2 shrink-0">
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
                                                        {deletingId ===
                                                        review._id
                                                            ? "..."
                                                            : "Delete"}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Show All Reviews link */}
                    {totalReviews > PREVIEW_LIMIT && productSlug && (
                        <div className="text-center mt-10">
                            <Link
                                to={`/products/${productSlug}/reviews`}
                                className="inline-block px-8 py-3 border border-divider text-text-primary text-xs tracking-widest uppercase hover:border-text-primary hover:bg-background-secondary transition-colors"
                            >
                                Show All {totalReviews} Reviews
                            </Link>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ProductReviews;
