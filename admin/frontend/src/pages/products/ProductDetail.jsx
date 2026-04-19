import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    MdArrowBack,
    MdEdit,
    MdDelete,
    MdStar,
    MdStarBorder,
    MdCheckCircle,
    MdCancel,
    MdExpandMore,
    MdExpandLess,
    MdImage,
    MdThumbUp,
    MdThumbDown,
    MdDeleteOutline,
} from "react-icons/md";
import { getProductById } from "../../api/products.api";
import {
    listReviews,
    approveReview,
    rejectReview,
    deleteReview,
} from "../../api/reviews.api";
import { handleApiError } from "../../utils/axios";
import logger from "../../utils/logger.util";
import Loader from "../../components/common/Loader";

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [expandedVariants, setExpandedVariants] = useState({});

    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewMessage, setReviewMessage] = useState(null);

    // Fetch product details
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                setError(null);

                logger.debug("Fetching product details for ID:", id);

                const response = await getProductById(id);

                if (response.success) {
                    setProduct(response.data);
                    logger.debug(
                        "Product fetched successfully:",
                        response.data,
                    );
                }
            } catch (err) {
                logger.error("Error fetching product:", err);
                const errorMessage = handleApiError(err);
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    // Fetch reviews for this product
    useEffect(() => {
        const fetchReviews = async () => {
            setReviewsLoading(true);
            try {
                const res = await listReviews({ productId: id, limit: 50 });
                if (res.success) {
                    setReviews(res.data || []);
                }
            } catch (err) {
                logger.error("Error fetching reviews:", err);
            } finally {
                setReviewsLoading(false);
            }
        };
        fetchReviews();
    }, [id]);

    // Approve a review
    const handleApproveReview = async (reviewId) => {
        try {
            const res = await approveReview(reviewId);
            if (res.success) {
                setReviews((prev) =>
                    prev.map((r) =>
                        r._id === reviewId ? { ...r, status: "approved" } : r,
                    ),
                );
                setReviewMessage({ type: "success", text: "Review approved." });
            }
        } catch (err) {
            logger.error("Error approving review:", err);
            setReviewMessage({
                type: "error",
                text: "Failed to approve review.",
            });
        }
        setTimeout(() => setReviewMessage(null), 3000);
    };

    // Reject a review
    const handleRejectReview = async (reviewId) => {
        try {
            const res = await rejectReview(reviewId);
            if (res.success) {
                setReviews((prev) =>
                    prev.map((r) =>
                        r._id === reviewId ? { ...r, status: "rejected" } : r,
                    ),
                );
                setReviewMessage({ type: "success", text: "Review rejected." });
            }
        } catch (err) {
            logger.error("Error rejecting review:", err);
            setReviewMessage({
                type: "error",
                text: "Failed to reject review.",
            });
        }
        setTimeout(() => setReviewMessage(null), 3000);
    };

    // Delete a review
    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm("Delete this review permanently?")) return;
        try {
            const res = await deleteReview(reviewId);
            if (res.success) {
                setReviews((prev) => prev.filter((r) => r._id !== reviewId));
                setReviewMessage({ type: "success", text: "Review deleted." });
            }
        } catch (err) {
            logger.error("Error deleting review:", err);
            setReviewMessage({
                type: "error",
                text: "Failed to delete review.",
            });
        }
        setTimeout(() => setReviewMessage(null), 3000);
    };

    // Format price
    const formatPrice = (price) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(price);
    };

    // Format date
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // Render stars
    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                i <= Math.floor(rating) ? (
                    <MdStar key={i} className="text-accent" size={20} />
                ) : (
                    <MdStarBorder key={i} className="text-accent" size={20} />
                ),
            );
        }
        return stars;
    };

    // Toggle variant expansion
    const toggleVariant = (variantId) => {
        setExpandedVariants((prev) => ({
            ...prev,
            [variantId]: !prev[variantId],
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-text-secondary hover:text-text transition-colors"
                >
                    <MdArrowBack size={20} />
                    Go Back
                </button>

                <div className="bg-danger bg-opacity-10 border border-danger text-danger px-4 py-3 rounded-lg">
                    {error}
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-12">
                <p className="text-text-secondary text-lg">Product not found</p>
                <Link
                    to="/products"
                    className="inline-block mt-4 text-primary hover:underline"
                >
                    Back to Products
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-text-secondary hover:text-text transition-colors"
                >
                    <MdArrowBack size={20} />
                    Back
                </button>

                <div className="flex items-center gap-2">
                    <Link
                        to={`/products/${product._id}/edit`}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
                    >
                        <MdEdit size={20} />
                        Edit Product
                    </Link>
                    <button className="flex items-center gap-2 bg-danger text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors">
                        <MdDelete size={20} />
                        Delete
                    </button>
                </div>
            </div>

            {/* Images and Basic Details */}
            <div className="bg-surface rounded-lg shadow-md p-6">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Images - Square Layout */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Main Image */}
                        <div className="aspect-square bg-background rounded-lg overflow-hidden border border-border">
                            <img
                                src={
                                    product.images?.[selectedImage]?.url ||
                                    "/placeholder.png"
                                }
                                alt={product.name}
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {/* Thumbnail Images */}
                        {product.images && product.images.length > 1 && (
                            <div className="grid grid-cols-5 gap-2">
                                {product.images.map((image, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(index)}
                                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                            selectedImage === index
                                                ? "border-primary"
                                                : "border-border hover:border-primary/50"
                                        }`}
                                    >
                                        <img
                                            src={image.url}
                                            alt={`${product.name} ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Details */}
                    <div className="lg:col-span-3 space-y-4">
                        {/* Title and Status */}
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-text">
                                    {product.name}
                                </h1>
                                <p className="text-text-secondary mt-1 text-sm">
                                    {product.slug}
                                </p>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <span
                                    className={`text-sm font-medium ${
                                        product.isActive
                                            ? "text-success"
                                            : "text-danger"
                                    }`}
                                >
                                    {product.isActive ? "Active" : "Inactive"}
                                </span>

                                {product.isFeatured && (
                                    <span className="text-sm font-medium text-accent">
                                        Featured
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Rating */}
                        {product.ratings && product.ratings.average > 0 && (
                            <div className="flex items-center gap-2">
                                <div className="flex">
                                    {renderStars(product.ratings.average)}
                                </div>
                                <span className="text-sm text-text-secondary">
                                    {product.ratings.average.toFixed(1)} (
                                    {product.ratings.count} reviews)
                                </span>
                            </div>
                        )}

                        {/* Price Range */}
                        <div className="py-4 border-y border-border">
                            <h3 className="text-sm text-text-secondary mb-1">
                                Price Range
                            </h3>
                            <p className="text-2xl font-bold text-primary">
                                {formatPrice(product.minPrice)} -{" "}
                                {formatPrice(product.maxPrice)}
                            </p>
                        </div>

                        {/* Short Description */}
                        {product.shortDescription && (
                            <div>
                                <h3 className="text-sm font-semibold text-text mb-1">
                                    Quick Info
                                </h3>
                                <p className="text-text-secondary">
                                    {product.shortDescription}
                                </p>
                            </div>
                        )}

                        {/* Description */}
                        {product.description && (
                            <div>
                                <h3 className="text-sm font-semibold text-text mb-1">
                                    Description
                                </h3>
                                <p className="text-text-secondary">
                                    {product.description}
                                </p>
                            </div>
                        )}

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-4 pt-4">
                            <div className="text-center p-3 bg-background rounded-lg">
                                <p className="text-xs text-text-secondary mb-1">
                                    Total Stock
                                </p>
                                <p
                                    className={`text-xl font-bold ${
                                        product.totalStock > 0
                                            ? "text-success"
                                            : "text-danger"
                                    }`}
                                >
                                    {product.totalStock || 0}
                                </p>
                            </div>
                            <div className="text-center p-3 bg-background rounded-lg">
                                <p className="text-xs text-text-secondary mb-1">
                                    Variants
                                </p>
                                <p className="text-xl font-bold text-text">
                                    {product.variants?.length || 0}
                                </p>
                            </div>
                            <div className="text-center p-3 bg-background rounded-lg">
                                <p className="text-xs text-text-secondary mb-1">
                                    Views
                                </p>
                                <p className="text-xl font-bold text-text">
                                    {product.viewCount || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Specifications */}
                <div className="bg-surface rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-text mb-4">
                        Specifications
                    </h3>

                    <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-border">
                            <span className="text-sm text-text-secondary">
                                Category
                            </span>
                            <span className="text-sm text-text font-medium">
                                {product.category?.name || "N/A"}
                            </span>
                        </div>

                        {product.subcategory && (
                            <div className="flex justify-between py-2 border-b border-border">
                                <span className="text-sm text-text-secondary">
                                    Subcategory
                                </span>
                                <span className="text-sm text-text font-medium">
                                    {product.subcategory.name}
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between py-2 border-b border-border">
                            <span className="text-sm text-text-secondary">
                                Purity
                            </span>
                            <span className="text-sm text-text font-medium">
                                {product.purity === "925"
                                    ? "925 (Sterling Silver)"
                                    : "999 (Pure Silver)"}
                            </span>
                        </div>

                        <div className="flex justify-between py-2 border-b border-border">
                            <span className="text-sm text-text-secondary">
                                Making Charges
                            </span>
                            <span className="text-sm text-text font-medium">
                                ₹{product.makingChargesPerGram}/gram
                            </span>
                        </div>

                        <div className="flex justify-between py-2 border-b border-border">
                            <span className="text-sm text-text-secondary">
                                GST Rate
                            </span>
                            <span className="text-sm text-text font-medium">
                                {product.gstRate}%
                            </span>
                        </div>

                        {product.attributes?.gender && (
                            <div className="flex justify-between py-2 border-b border-border">
                                <span className="text-sm text-text-secondary">
                                    Gender
                                </span>
                                <span className="text-sm text-text font-medium capitalize">
                                    {product.attributes.gender}
                                </span>
                            </div>
                        )}

                        {product.attributes?.occasion && (
                            <div className="flex justify-between py-2 border-b border-border">
                                <span className="text-sm text-text-secondary">
                                    Occasion
                                </span>
                                <span className="text-sm text-text font-medium">
                                    {product.attributes.occasion}
                                </span>
                            </div>
                        )}

                        {product.attributes?.gemstone && (
                            <div className="flex justify-between py-2 border-b border-border">
                                <span className="text-sm text-text-secondary">
                                    Gemstone
                                </span>
                                <span className="text-sm text-text font-medium">
                                    {product.attributes.gemstone}
                                </span>
                            </div>
                        )}

                        {product.attributes?.plating && (
                            <div className="flex justify-between py-2 border-b border-border">
                                <span className="text-sm text-text-secondary">
                                    Plating
                                </span>
                                <span className="text-sm text-text font-medium">
                                    {product.attributes.plating}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-6">
                    {/* Hallmark */}
                    {product.hallmark?.isHallmarked && (
                        <div className="bg-surface rounded-lg shadow-md p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <MdCheckCircle
                                    className="text-success"
                                    size={24}
                                />
                                <h3 className="text-lg font-semibold text-text">
                                    Hallmark Information
                                </h3>
                            </div>

                            <div className="space-y-3">
                                {product.hallmark.bisLicenseNumber && (
                                    <div className="flex justify-between py-2 border-b border-border">
                                        <span className="text-sm text-text-secondary">
                                            BIS License
                                        </span>
                                        <span className="text-sm text-text font-medium">
                                            {product.hallmark.bisLicenseNumber}
                                        </span>
                                    </div>
                                )}
                                {product.hallmark.hallmarkingCenter && (
                                    <div className="flex justify-between py-2 border-b border-border">
                                        <span className="text-sm text-text-secondary">
                                            Center
                                        </span>
                                        <span className="text-sm text-text font-medium">
                                            {product.hallmark.hallmarkingCenter}
                                        </span>
                                    </div>
                                )}
                                {product.hallmark.purityCertified && (
                                    <div className="flex justify-between py-2 border-b border-border">
                                        <span className="text-sm text-text-secondary">
                                            Certified Purity
                                        </span>
                                        <span className="text-sm text-text font-medium">
                                            {product.hallmark.purityCertified}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Collections */}
                    {product.collections && product.collections.length > 0 && (
                        <div className="bg-surface rounded-lg shadow-md p-6">
                            <h3 className="text-lg font-semibold text-text mb-3">
                                Collections
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {product.collections.map(
                                    (collection, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 rounded-lg text-sm bg-accent text-white font-medium"
                                        >
                                            {collection}
                                        </span>
                                    ),
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tags */}
                    {product.tags && product.tags.length > 0 && (
                        <div className="bg-surface rounded-lg shadow-md p-6">
                            <h3 className="text-lg font-semibold text-text mb-3">
                                Tags
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {product.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 rounded-lg text-sm bg-background text-text"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Meta Info */}
                    <div className="bg-surface rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-text mb-3">
                            Meta Information
                        </h3>
                        <div className="space-y-2 text-sm text-text-secondary">
                            <p>
                                <span className="font-medium">Created:</span>{" "}
                                {formatDate(product.createdAt)}
                            </p>
                            <p>
                                <span className="font-medium">
                                    Last Updated:
                                </span>{" "}
                                {formatDate(product.updatedAt)}
                            </p>
                            {product.createdBy && (
                                <p>
                                    <span className="font-medium">
                                        Created By:
                                    </span>{" "}
                                    {typeof product.createdBy === "object"
                                        ? product.createdBy.name ||
                                          product.createdBy.email
                                        : product.createdBy}
                                </p>
                            )}
                            {product.updatedBy && (
                                <p>
                                    <span className="font-medium">
                                        Updated By:
                                    </span>{" "}
                                    {typeof product.updatedBy === "object"
                                        ? product.updatedBy.name ||
                                          product.updatedBy.email
                                        : product.updatedBy}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Variants Section */}
            <div className="bg-surface rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-text mb-6">
                    Product Variants ({product.variants?.length || 0})
                </h3>

                {product.variants && product.variants.length > 0 ? (
                    <div className="space-y-3">
                        {product.variants.map((variant) => (
                            <div
                                key={variant._id}
                                className="border border-border rounded-lg overflow-hidden bg-background"
                            >
                                {/* Collapsed Row - Table-like Header */}
                                <button
                                    onClick={() => toggleVariant(variant._id)}
                                    className="w-full hover:bg-border/20 transition-colors"
                                >
                                    <div className="grid grid-cols-12 gap-3 px-4 py-3 items-center">
                                        {/* Image Thumbnail */}
                                        <div className="col-span-1">
                                            {variant.images &&
                                            variant.images.length > 0 ? (
                                                <div className="relative w-12 h-12 rounded overflow-hidden border border-border">
                                                    <img
                                                        src={
                                                            variant.images[0]
                                                                .url
                                                        }
                                                        alt={
                                                            variant.images[0]
                                                                .alt ||
                                                            variant.variantName
                                                        }
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {variant.images.length >
                                                        1 && (
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-semibold">
                                                            +
                                                            {variant.images
                                                                .length - 1}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center text-xs text-text-secondary">
                                                    <MdImage size={20} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Variant Name & SKU */}
                                        <div className="col-span-3 text-left">
                                            <div className="font-semibold text-sm text-text">
                                                {variant.variantName}
                                            </div>
                                            <div className="text-xs text-text-secondary font-mono">
                                                {variant.sku}
                                            </div>
                                        </div>

                                        {/* Attributes */}
                                        <div className="col-span-2 text-left">
                                            {variant.attributes &&
                                            variant.attributes.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {variant.attributes
                                                        .slice(0, 2)
                                                        .map((attr, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="text-xs bg-surface border border-border px-1.5 py-0.5 rounded"
                                                            >
                                                                {attr.value}
                                                            </span>
                                                        ))}
                                                    {variant.attributes.length >
                                                        2 && (
                                                        <span className="text-xs text-text-secondary">
                                                            +
                                                            {variant.attributes
                                                                .length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-text-secondary">
                                                    -
                                                </span>
                                            )}
                                        </div>

                                        {/* Price */}
                                        <div className="col-span-2 text-left">
                                            <div className="font-semibold text-sm text-text">
                                                {formatPrice(
                                                    variant.sellingPrice,
                                                )}
                                            </div>
                                            {variant.hasDiscount && (
                                                <div className="text-xs text-text-secondary line-through">
                                                    {formatPrice(variant.mrp)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Stock */}
                                        <div className="col-span-2 text-left">
                                            <span
                                                className={`text-sm font-medium ${
                                                    variant.stockStatus ===
                                                    "in_stock"
                                                        ? "text-success"
                                                        : variant.stockStatus ===
                                                            "low_stock"
                                                          ? "text-warning"
                                                          : "text-danger"
                                                }`}
                                            >
                                                {variant.stockQuantity} units
                                            </span>
                                            <div className="text-xs text-text-secondary">
                                                {variant.stockStatus ===
                                                "in_stock"
                                                    ? "In Stock"
                                                    : variant.stockStatus ===
                                                        "low_stock"
                                                      ? "Low Stock"
                                                      : "Out of Stock"}
                                            </div>
                                        </div>

                                        {/* Status & Expand */}
                                        <div className="col-span-2 flex items-center justify-end gap-3">
                                            {variant.isActive ? (
                                                <MdCheckCircle
                                                    className="text-success"
                                                    size={20}
                                                />
                                            ) : (
                                                <MdCancel
                                                    className="text-danger"
                                                    size={20}
                                                />
                                            )}
                                            {expandedVariants[variant._id] ? (
                                                <MdExpandLess
                                                    size={24}
                                                    className="text-text-secondary"
                                                />
                                            ) : (
                                                <MdExpandMore
                                                    size={24}
                                                    className="text-text-secondary"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </button>

                                {/* Expanded Content */}
                                {expandedVariants[variant._id] && (
                                    <div className="border-t border-border bg-surface/50">
                                        <div className="p-6">
                                            {/* Images Gallery */}
                                            {variant.images &&
                                                variant.images.length > 0 && (
                                                    <div className="mb-6">
                                                        <h4 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                                                            <MdImage
                                                                size={18}
                                                            />
                                                            Variant Images (
                                                            {
                                                                variant.images
                                                                    .length
                                                            }
                                                            )
                                                        </h4>
                                                        {/* <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"> */}
                                                        <div className="flex items-center gap-1">
                                                            {variant.images.map(
                                                                (img, idx) => (
                                                                    <div
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="relative w-32 aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors group"
                                                                    >
                                                                        <img
                                                                            src={
                                                                                img.url
                                                                            }
                                                                            alt={
                                                                                img.alt ||
                                                                                `Image ${idx + 1}`
                                                                            }
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                                                        {img.isPrimary && (
                                                                            <div className="absolute top-1 left-1 bg-primary text-white text-xs px-2 py-0.5 rounded">
                                                                                Primary
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                            {/* Details Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                {/* Pricing Details */}
                                                <div className="bg-background rounded-lg p-4 border border-border">
                                                    <h4 className="text-sm font-semibold text-text mb-3 pb-2 border-b border-border">
                                                        Pricing
                                                    </h4>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-text-secondary">
                                                                MRP:
                                                            </span>
                                                            <span className="text-text font-medium">
                                                                {formatPrice(
                                                                    variant.mrp,
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-text-secondary">
                                                                Selling Price:
                                                            </span>
                                                            <span className="text-text font-semibold">
                                                                {formatPrice(
                                                                    variant.sellingPrice,
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-text-secondary">
                                                                Cost Price:
                                                            </span>
                                                            <span className="text-text">
                                                                {formatPrice(
                                                                    variant.costPrice,
                                                                )}
                                                            </span>
                                                        </div>
                                                        {variant.hasDiscount && (
                                                            <>
                                                                <div className="flex justify-between pt-2 border-t border-border">
                                                                    <span className="text-text-secondary">
                                                                        Discount:
                                                                    </span>
                                                                    <span className="text-success font-semibold">
                                                                        {
                                                                            variant.discountPercent
                                                                        }
                                                                        %
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-text-secondary">
                                                                        Saved:
                                                                    </span>
                                                                    <span className="text-success">
                                                                        {formatPrice(
                                                                            variant.discountAmount,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </>
                                                        )}
                                                        {variant.profitMargin !==
                                                            undefined && (
                                                            <div className="flex justify-between pt-2 border-t border-border">
                                                                <span className="text-text-secondary">
                                                                    Profit
                                                                    Margin:
                                                                </span>
                                                                <span className="text-success font-semibold">
                                                                    {
                                                                        variant.profitMargin
                                                                    }
                                                                    %
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Stock & Inventory */}
                                                <div className="bg-background rounded-lg p-4 border border-border">
                                                    <h4 className="text-sm font-semibold text-text mb-3 pb-2 border-b border-border">
                                                        Inventory
                                                    </h4>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-text-secondary">
                                                                Quantity:
                                                            </span>
                                                            <span
                                                                className={`font-semibold ${
                                                                    variant.stockQuantity >
                                                                    0
                                                                        ? "text-success"
                                                                        : "text-danger"
                                                                }`}
                                                            >
                                                                {
                                                                    variant.stockQuantity
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-text-secondary">
                                                                Status:
                                                            </span>
                                                            <span
                                                                className={`font-medium capitalize ${
                                                                    variant.stockStatus ===
                                                                    "in_stock"
                                                                        ? "text-success"
                                                                        : variant.stockStatus ===
                                                                            "low_stock"
                                                                          ? "text-warning"
                                                                          : "text-danger"
                                                                }`}
                                                            >
                                                                {variant.stockStatus?.replace(
                                                                    "_",
                                                                    " ",
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-text-secondary">
                                                                Low Stock Alert:
                                                            </span>
                                                            <span className="text-text">
                                                                {
                                                                    variant.lowStockThreshold
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between pt-2 border-t border-border">
                                                            <span className="text-text-secondary">
                                                                Weight:
                                                            </span>
                                                            <span className="text-text font-medium">
                                                                {variant.weight}
                                                                g
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Attributes & Dimensions */}
                                                <div className="bg-background rounded-lg p-4 border border-border">
                                                    <h4 className="text-sm font-semibold text-text mb-3 pb-2 border-b border-border">
                                                        Specifications
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {/* Attributes */}
                                                        {variant.attributes &&
                                                            variant.attributes
                                                                .length > 0 && (
                                                                <div>
                                                                    <p className="text-xs font-semibold text-text-secondary mb-2">
                                                                        Attributes
                                                                    </p>
                                                                    <div className="space-y-1.5">
                                                                        {variant.attributes.map(
                                                                            (
                                                                                attr,
                                                                                idx,
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        idx
                                                                                    }
                                                                                    className="flex justify-between text-sm"
                                                                                >
                                                                                    <span className="text-text-secondary">
                                                                                        {
                                                                                            attr.key
                                                                                        }

                                                                                        :
                                                                                    </span>
                                                                                    <span className="text-text font-medium">
                                                                                        {
                                                                                            attr.value
                                                                                        }
                                                                                    </span>
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                        {/* Dimensions */}
                                                        {variant.dimensions && (
                                                            <div className="pt-2 border-t border-border">
                                                                <p className="text-xs font-semibold text-text-secondary mb-2">
                                                                    Dimensions
                                                                </p>
                                                                <div className="space-y-1.5">
                                                                    {variant
                                                                        .dimensions
                                                                        .length && (
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="text-text-secondary">
                                                                                Length:
                                                                            </span>
                                                                            <span className="text-text">
                                                                                {
                                                                                    variant
                                                                                        .dimensions
                                                                                        .length
                                                                                }
                                                                                cm
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    {variant
                                                                        .dimensions
                                                                        .width && (
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="text-text-secondary">
                                                                                Width:
                                                                            </span>
                                                                            <span className="text-text">
                                                                                {
                                                                                    variant
                                                                                        .dimensions
                                                                                        .width
                                                                                }
                                                                                cm
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    {variant
                                                                        .dimensions
                                                                        .height && (
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="text-text-secondary">
                                                                                Height:
                                                                            </span>
                                                                            <span className="text-text">
                                                                                {
                                                                                    variant
                                                                                        .dimensions
                                                                                        .height
                                                                                }
                                                                                cm
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Metadata */}
                                                <div className="bg-background rounded-lg p-4 border border-border">
                                                    <h4 className="text-sm font-semibold text-text mb-3 pb-2 border-b border-border">
                                                        History
                                                    </h4>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-text-secondary">
                                                                Sort Order:
                                                            </span>
                                                            <span className="text-text">
                                                                {
                                                                    variant.sortOrder
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-text-secondary">
                                                                Created:
                                                            </span>
                                                            <span className="text-text text-xs">
                                                                {formatDate(
                                                                    variant.createdAt,
                                                                )}
                                                            </span>
                                                        </div>
                                                        {variant.updatedAt !==
                                                            variant.createdAt && (
                                                            <div className="flex justify-between">
                                                                <span className="text-text-secondary">
                                                                    Updated:
                                                                </span>
                                                                <span className="text-text text-xs">
                                                                    {formatDate(
                                                                        variant.updatedAt,
                                                                    )}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {variant.lastPriceUpdate && (
                                                            <div className="flex justify-between pt-2 border-t border-border">
                                                                <span className="text-text-secondary">
                                                                    Price
                                                                    Update:
                                                                </span>
                                                                <span className="text-text text-xs">
                                                                    {formatDate(
                                                                        variant.lastPriceUpdate,
                                                                    )}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-text-secondary py-8">
                        No variants available
                    </p>
                )}
            </div>

            {/* Customer Reviews */}
            <div className="bg-surface rounded-lg shadow-md p-6 space-y-4">
                <h2 className="text-xl font-semibold text-text border-b border-border pb-2">
                    Customer Reviews ({reviews.length})
                </h2>

                {reviewMessage && (
                    <div
                        className={`px-4 py-3 rounded-lg text-sm ${
                            reviewMessage.type === "success"
                                ? "bg-success/10 border border-success text-success"
                                : "bg-danger/10 border border-danger text-danger"
                        }`}
                    >
                        {reviewMessage.text}
                    </div>
                )}

                {reviewsLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader />
                    </div>
                ) : reviews.length === 0 ? (
                    <p className="text-center text-text-secondary py-8">
                        No reviews yet for this product.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <div
                                key={review._id}
                                className="border border-border rounded-lg p-4 space-y-2"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-1">
                                        {/* Reviewer + date */}
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium text-text">
                                                {review.customerName ||
                                                    "Anonymous"}
                                            </span>
                                            <span className="text-xs text-text-secondary">
                                                {formatDate(review.createdAt)}
                                            </span>
                                            {/* Status badge */}
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                    review.status === "approved"
                                                        ? "bg-success/10 text-success"
                                                        : review.status ===
                                                            "rejected"
                                                          ? "bg-danger/10 text-danger"
                                                          : "bg-accent/10 text-accent"
                                                }`}
                                            >
                                                {review.status || "pending"}
                                            </span>
                                        </div>

                                        {/* Stars */}
                                        <div className="flex items-center gap-1">
                                            {renderStars(review.rating)}
                                            <span className="text-sm text-text-secondary ml-1">
                                                ({review.rating}/5)
                                            </span>
                                        </div>

                                        {/* Review text */}
                                        {review.comment && (
                                            <p className="text-text text-sm">
                                                {review.comment}
                                            </p>
                                        )}

                                        {/* Admin note */}
                                        {review.adminNote && (
                                            <p className="text-xs text-text-secondary italic">
                                                Admin note: {review.adminNote}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        {review.status !== "approved" && (
                                            <button
                                                onClick={() =>
                                                    handleApproveReview(
                                                        review._id,
                                                    )
                                                }
                                                title="Approve"
                                                className="flex items-center gap-1 text-xs bg-success/10 text-success border border-success/30 px-2 py-1 rounded hover:bg-success/20 transition-colors"
                                            >
                                                <MdThumbUp size={14} />
                                                Approve
                                            </button>
                                        )}
                                        {review.status !== "rejected" && (
                                            <button
                                                onClick={() =>
                                                    handleRejectReview(
                                                        review._id,
                                                    )
                                                }
                                                title="Reject"
                                                className="flex items-center gap-1 text-xs bg-danger/10 text-danger border border-danger/30 px-2 py-1 rounded hover:bg-danger/20 transition-colors"
                                            >
                                                <MdThumbDown size={14} />
                                                Reject
                                            </button>
                                        )}
                                        <button
                                            onClick={() =>
                                                handleDeleteReview(review._id)
                                            }
                                            title="Delete"
                                            className="flex items-center gap-1 text-xs bg-background text-text-secondary border border-border px-2 py-1 rounded hover:bg-danger/10 hover:text-danger transition-colors"
                                        >
                                            <MdDeleteOutline size={14} />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetail;
