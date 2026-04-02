import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
    FiShoppingBag,
    FiHeart,
    FiChevronDown,
    FiMinus,
    FiPlus,
} from "react-icons/fi";
import { FaHeart, FaStar } from "react-icons/fa";
import ProductDetailSkeleton from "../components/products/ProductDetailSkeleton";
import ProductReviews from "../components/products/ProductReviews";
import { getProductBySlug, getProductVariants } from "../api/products.api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { getImageUrl } from "../utils/image.util";
import logger from "../utils/logger.util";

const ProductDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { addToCart: addToCartContext } = useCart();
    const {
        isInWishlist,
        toggleWishlist,
        isLoading: isWishlistLoading,
    } = useWishlist();

    const [product, setProduct] = useState(null);
    const [variants, setVariants] = useState([]);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [activeTab, setActiveTab] = useState("description");
    const [expandedSections, setExpandedSections] = useState(["description"]);

    // Fetch product and variants
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                setError(null);

                // First fetch product by slug
                const productRes = await getProductBySlug(slug);

                if (productRes.data?.success) {
                    const productData = productRes.data.data;
                    setProduct(productData);

                    // Then fetch variants using the actual product ID
                    const variantsRes = await getProductVariants(
                        productData._id,
                    );

                    if (variantsRes.data?.success) {
                        const variantData = variantsRes.data.data;
                        setVariants(variantData);

                        // Priority order for variant selection:
                        // 1. URL param variantId (from wishlist/share)
                        // 2. First in-stock variant
                        // 3. First variant (if all out of stock)

                        const urlVariantId = searchParams.get("variantId");

                        if (urlVariantId) {
                            const urlVariant = variantData.find(
                                (v) => v._id === urlVariantId,
                            );
                            if (urlVariant) {
                                setSelectedVariant(urlVariant);
                                return;
                            }
                        }

                        // Fallback: Auto-select first in-stock variant
                        const firstAvailable = variantData.find(
                            (v) => v.stockQuantity > 0,
                        );
                        if (firstAvailable) {
                            setSelectedVariant(firstAvailable);
                        } else if (variantData.length > 0) {
                            setSelectedVariant(variantData[0]);
                        }
                    }
                }
            } catch (err) {
                logger.error("Failed to fetch product:", err);
                setError("Failed to load product details");
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [slug]);

    // Get current images (variant images or product images)
    const currentImages =
        selectedVariant?.images?.length > 0
            ? selectedVariant.images
            : product?.images || [];

    // Group variants by attribute type for selection UI
    const variantAttributes = () => {
        if (!variants.length) return {};

        const grouped = {};
        variants.forEach((variant) => {
            variant.attributes?.forEach((attr) => {
                if (!grouped[attr.key]) {
                    grouped[attr.key] = new Set();
                }
                grouped[attr.key].add(attr.value);
            });
        });

        // Convert sets to arrays
        Object.keys(grouped).forEach((key) => {
            grouped[key] = Array.from(grouped[key]);
        });

        return grouped;
    };

    const attributes = variantAttributes();

    // Handle attribute selection
    const handleAttributeSelect = (key, value) => {
        // Find variant matching the selected attribute
        const matchingVariant = variants.find((v) =>
            v.attributes?.some(
                (attr) => attr.key === key && attr.value === value,
            ),
        );

        if (matchingVariant) {
            setSelectedVariant(matchingVariant);
            setSelectedImage(0); // Reset to first image
        }
    };

    // Check if attribute value is selected
    const isAttributeSelected = (key, value) => {
        return selectedVariant?.attributes?.some(
            (attr) => attr.key === key && attr.value === value,
        );
    };

    // Handle wishlist toggle
    const handleWishlistToggle = async () => {
        if (!selectedVariant) {
            logger.warn("No variant selected for wishlist");
            return;
        }

        try {
            await toggleWishlist(product._id, selectedVariant._id);
        } catch (err) {
            logger.error("Wishlist toggle failed:", err);
        }
    };

    // Handle add to cart
    const handleAddToCart = async () => {
        if (!selectedVariant) {
            logger.warn("No variant selected");
            return;
        }

        if (selectedVariant.stockQuantity < quantity) {
            logger.warn("Insufficient stock", {
                available: selectedVariant.stockQuantity,
                requested: quantity,
            });
            // TODO: Show notification
            return;
        }

        try {
            setIsAddingToCart(true);
            const success = await addToCartContext(
                product._id,
                selectedVariant._id,
                quantity,
            );

            if (success) {
                logger.info("Added to cart successfully", {
                    productId: product._id,
                    variantId: selectedVariant._id,
                    quantity,
                });
                // TODO: Show success notification
            }
        } catch (err) {
            logger.error("Failed to add to cart:", err);
            // TODO: Show error notification
        } finally {
            setIsAddingToCart(false);
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

    // Toggle collapsible section for mobile
    const toggleSection = (section) => {
        setExpandedSections((prev) =>
            prev.includes(section)
                ? prev.filter((s) => s !== section)
                : [...prev, section],
        );
    };

    if (loading) {
        return <ProductDetailSkeleton />;
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-text-secondary text-lg xl:text-xl mb-4">
                        {error || "Product not found"}
                    </p>
                    <button
                        onClick={() => navigate("/shop")}
                        className="text-accent-1 hover:underline"
                    >
                        Back to Shop
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-primary">
            <div className="px-4 lg:px-8 xl:px-16 py-4 lg:py-8">
                <div className="grid grid-cols-1 md:grid-cols-[35%_50%] gap-12 mb-32">
                    {/* Image Gallery */}
                    <div className="space-y-3">
                        {/* Main Image */}
                        <div className="w-full aspect-square bg-background-secondary rounded-sm overflow-hidden">
                            <img
                                src={getImageUrl(
                                    currentImages[selectedImage],
                                    "large",
                                )}
                                alt={
                                    currentImages[selectedImage]?.alt ||
                                    product.name
                                }
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Thumbnail Gallery */}
                        {currentImages.length > 1 && (
                            <div className="grid grid-cols-5 gap-3">
                                {currentImages
                                    .slice(0, 4)
                                    .map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={() =>
                                                setSelectedImage(index)
                                            }
                                            className={`aspect-square rounded-sm overflow-hidden border transition-all`}
                                        >
                                            <img
                                                src={getImageUrl(
                                                    image,
                                                    "small",
                                                )}
                                                alt={
                                                    image.alt ||
                                                    `View ${index + 1}`
                                                }
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-5">
                        {/* Title */}
                        <div>
                            <h1 className="text-2xl lg:text-3xl xl:text-4xl font-medium font-display text-text-primary mb-3">
                                {product.name}
                            </h1>

                            {/* Ratings */}
                            {product.ratings?.count > 0 && (
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex items-center gap-0.5">
                                        <span className="text-sm xl:text-base font-medium text-text-primary/60 mr-1">
                                            {product.ratings.average.toFixed(1)}
                                        </span>
                                        <FaStar className="w-3 h-3 text-accent-1" />
                                    </div>
                                    <span className="text-sm xl:text-base text-text-primary/60">
                                        {product.ratings.count} review
                                        {product.ratings.count !== 1 ? "s" : ""}
                                    </span>
                                </div>
                            )}

                            {/* Price & Stock */}
                            {selectedVariant && (
                                <div className="flex items-center gap-6 mb-4">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl xl:text-3xl font-semibold text-text-primary/70">
                                            {formatPrice(
                                                selectedVariant.sellingPrice,
                                            )}
                                        </span>
                                    </div>
                                    <span
                                        className={`text-base xl:text-base font-semibold inline-flex items-center gap-1 rounded-xs bg-accent-1/10 px-2 ${
                                            selectedVariant.stockQuantity > 0
                                                ? "text-accent-1"
                                                : "text-danger"
                                        }`}
                                    >
                                        <span
                                            className={`w-2 h-2 rounded-full ${
                                                selectedVariant.stockQuantity >
                                                0
                                                    ? "bg-accent-1"
                                                    : "bg-danger"
                                            }`}
                                        />
                                        {selectedVariant.stockQuantity > 0
                                            ? "In Stock"
                                            : "Out of Stock"}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Short Description */}
                        {product.shortDescription && (
                            <p className="text-sm xl:text-base text-text-secondary leading-relaxed">
                                {product.shortDescription}
                            </p>
                        )}

                        {/* Variant Selection */}
                        {Object.keys(attributes).length > 0 && (
                            <div className="space-y-5">
                                {Object.entries(attributes).map(
                                    ([key, values]) => (
                                        <div key={key}>
                                            <h3 className="text-sm xl:text-base font-medium text-text-primary/70 mb-2">
                                                {key}:{" "}
                                                <span className="font-normal text-text-secondary">
                                                    {
                                                        selectedVariant?.attributes?.find(
                                                            (attr) =>
                                                                attr.key ===
                                                                key,
                                                        )?.value
                                                    }
                                                </span>
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {values.map((value) => {
                                                    const isSelected =
                                                        isAttributeSelected(
                                                            key,
                                                            value,
                                                        );
                                                    const variantWithValue =
                                                        variants.find((v) =>
                                                            v.attributes?.some(
                                                                (attr) =>
                                                                    attr.key ===
                                                                        key &&
                                                                    attr.value ===
                                                                        value,
                                                            ),
                                                        );
                                                    const isAvailable =
                                                        variantWithValue?.stockQuantity >
                                                        0;

                                                    return (
                                                        <button
                                                            key={value}
                                                            onClick={() =>
                                                                handleAttributeSelect(
                                                                    key,
                                                                    value,
                                                                )
                                                            }
                                                            disabled={
                                                                !isAvailable
                                                            }
                                                            className={`px-4 py-1 rounded-sm border transition-all text-sm xl:text-base ${
                                                                isSelected
                                                                    ? "border-text-primary/70"
                                                                    : isAvailable
                                                                      ? "border-divider hover:border-text-secondary text-text-primary"
                                                                      : "border-divider text-text-secondary line-through opacity-50 cursor-not-allowed"
                                                            }`}
                                                        >
                                                            {value}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        )}

                        {/* Quantity Selector */}
                        {selectedVariant &&
                            selectedVariant.stockQuantity > 0 && (
                                <div className="flex items-center gap-4">
                                    <label className="text-sm xl:text-base font-medium text-text-primary/70">
                                        Quantity:
                                    </label>
                                    <div className="flex items-center">
                                        <button
                                            onClick={() =>
                                                setQuantity(
                                                    Math.max(1, quantity - 1),
                                                )
                                            }
                                            className="w-8 h-8 flex items-center justify-center border border-divider rounded-sm hover:bg-background-secondary transition-colors"
                                        >
                                            <FiMinus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="w-10 h-8 flex items-center justify-center text-sm xl:text-base font-medium text-text-primary">
                                            {quantity}
                                        </span>
                                        <button
                                            onClick={() =>
                                                setQuantity(
                                                    Math.min(
                                                        selectedVariant.stockQuantity,
                                                        quantity + 1,
                                                    ),
                                                )
                                            }
                                            className="w-8 h-8 flex items-center justify-center border border-divider rounded-sm hover:bg-background-secondary transition-colors"
                                        >
                                            <FiPlus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleAddToCart}
                                disabled={
                                    !selectedVariant ||
                                    selectedVariant.stockQuantity === 0 ||
                                    isAddingToCart
                                }
                                className="w-100 bg-text-primary text-white py-3 px-6 rounded-sm flex items-center justify-center gap-4 hover:bg-text-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FiShoppingBag className="w-5 h-5" />
                                {isAddingToCart
                                    ? "ADDING..."
                                    : selectedVariant?.stockQuantity === 0
                                      ? "OUT OF STOCK"
                                      : "ADD TO CART"}
                            </button>

                            <button
                                onClick={handleWishlistToggle}
                                disabled={!selectedVariant || isWishlistLoading}
                                className="p-3 border border-divider rounded-sm hover:border-text-secondary hover:bg-background-secondary transition-colors"
                            >
                                {selectedVariant &&
                                isInWishlist(
                                    product._id,
                                    selectedVariant._id,
                                ) ? (
                                    <FaHeart className="w-5 h-5 text-accent-1" />
                                ) : (
                                    <FiHeart className="w-5 h-5" />
                                )}
                            </button>
                        </div>

                        {/* Tabs Section - Desktop */}
                        <div className="mt-8 hidden lg:block">
                            {/* Tab Headers */}
                            <div className="border-b border-divider">
                                <div className="flex gap-6 overflow-x-auto">
                                    <button
                                        onClick={() =>
                                            setActiveTab("description")
                                        }
                                        className={`pb-3 text-sm xl:text-base font-medium transition-colors relative whitespace-nowrap ${
                                            activeTab === "description"
                                                ? "text-text-primary"
                                                : "text-text-secondary hover:text-text-primary"
                                        }`}
                                    >
                                        Description
                                        {activeTab === "description" && (
                                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-text-primary" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() =>
                                            setActiveTab("specifications")
                                        }
                                        className={`pb-3 text-sm xl:text-base font-medium transition-colors relative whitespace-nowrap ${
                                            activeTab === "specifications"
                                                ? "text-text-primary"
                                                : "text-text-secondary hover:text-text-primary"
                                        }`}
                                    >
                                        Specifications
                                        {activeTab === "specifications" && (
                                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-text-primary" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() =>
                                            setActiveTab("stone-details")
                                        }
                                        className={`pb-3 text-sm xl:text-base font-medium transition-colors relative whitespace-nowrap ${
                                            activeTab === "stone-details"
                                                ? "text-text-primary"
                                                : "text-text-secondary hover:text-text-primary"
                                        }`}
                                    >
                                        Stone Details
                                        {activeTab === "stone-details" && (
                                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-text-primary" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("care")}
                                        className={`pb-3 text-sm xl:text-base font-medium transition-colors relative whitespace-nowrap ${
                                            activeTab === "care"
                                                ? "text-text-primary"
                                                : "text-text-secondary hover:text-text-primary"
                                        }`}
                                    >
                                        Care Instructions
                                        {activeTab === "care" && (
                                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-text-primary" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Tab Content */}
                            <div className="py-6">
                                {activeTab === "description" && (
                                    <div className="text-sm xl:text-base text-text-secondary leading-relaxed">
                                        {product.description ? (
                                            <p className="whitespace-pre-line">
                                                {product.description}
                                            </p>
                                        ) : (
                                            <p>No description available.</p>
                                        )}
                                    </div>
                                )}

                                {activeTab === "specifications" && (
                                    <div>
                                        {selectedVariant ? (
                                            <div className="space-y-3 text-sm xl:text-base">
                                                <div className="flex py-2 border-b border-divider">
                                                    <span className="text-text-secondary w-40">
                                                        SKU:
                                                    </span>
                                                    <span className="text-text-primary font-medium">
                                                        {selectedVariant.sku}
                                                    </span>
                                                </div>
                                                {selectedVariant.weight && (
                                                    <div className="flex py-2 border-b border-divider">
                                                        <span className="text-text-secondary w-40">
                                                            Weight:
                                                        </span>
                                                        <span className="text-text-primary">
                                                            {
                                                                selectedVariant.weight
                                                            }
                                                            g
                                                        </span>
                                                    </div>
                                                )}
                                                {selectedVariant.dimensions
                                                    ?.length && (
                                                    <div className="flex py-2 border-b border-divider">
                                                        <span className="text-text-secondary w-40">
                                                            Dimensions:
                                                        </span>
                                                        <span className="text-text-primary">
                                                            {
                                                                selectedVariant
                                                                    .dimensions
                                                                    .length
                                                            }
                                                            {selectedVariant
                                                                .dimensions
                                                                .width &&
                                                                ` x ${selectedVariant.dimensions.width}`}
                                                            {selectedVariant
                                                                .dimensions
                                                                .height &&
                                                                ` x ${selectedVariant.dimensions.height}`}{" "}
                                                            cm
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm xl:text-base text-text-secondary">
                                                Select a variant to view
                                                specifications.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {activeTab === "stone-details" && (
                                    <div className="text-sm xl:text-base text-text-secondary leading-relaxed">
                                        <p>
                                            Stone details information will be
                                            displayed here.
                                        </p>
                                    </div>
                                )}

                                {activeTab === "care" && (
                                    <div className="text-sm xl:text-base text-text-secondary leading-relaxed space-y-3">
                                        <p>
                                            • Store in a cool, dry place away
                                            from direct sunlight.
                                        </p>
                                        <p>
                                            • Clean gently with a soft cloth
                                            after each use.
                                        </p>
                                        <p>
                                            • Avoid contact with perfumes,
                                            cosmetics, and harsh chemicals.
                                        </p>
                                        <p>
                                            • Remove jewelry before bathing,
                                            swimming, or exercising.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Collapsible Sections - Mobile */}
                        <div className="mt-8 lg:hidden space-y-3">
                            {/* Description Section */}
                            <div className="border border-divider rounded-sm">
                                <button
                                    onClick={() => toggleSection("description")}
                                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                                >
                                    <span className="text-sm font-medium text-text-primary">
                                        Description
                                    </span>
                                    <FiChevronDown
                                        className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${
                                            expandedSections.includes(
                                                "description",
                                            )
                                                ? "rotate-180"
                                                : ""
                                        }`}
                                    />
                                </button>
                                {expandedSections.includes("description") && (
                                    <div className="px-4 pb-4 text-sm text-text-secondary leading-relaxed border-t border-divider pt-4">
                                        {product.description ? (
                                            <p className="whitespace-pre-line">
                                                {product.description}
                                            </p>
                                        ) : (
                                            <p>No description available.</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Specifications Section */}
                            <div className="border border-divider rounded-sm">
                                <button
                                    onClick={() =>
                                        toggleSection("specifications")
                                    }
                                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                                >
                                    <span className="text-sm font-medium text-text-primary">
                                        Specifications
                                    </span>
                                    <FiChevronDown
                                        className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${
                                            expandedSections.includes(
                                                "specifications",
                                            )
                                                ? "rotate-180"
                                                : ""
                                        }`}
                                    />
                                </button>
                                {expandedSections.includes(
                                    "specifications",
                                ) && (
                                    <div className="px-4 pb-4 border-t border-divider pt-4">
                                        {selectedVariant ? (
                                            <div className="text-sm">
                                                <div className="flex py-2">
                                                    <span className="text-text-secondary w-30">
                                                        SKU:
                                                    </span>
                                                    <span className="text-text-primary font-medium">
                                                        {selectedVariant.sku}
                                                    </span>
                                                </div>
                                                {selectedVariant.weight && (
                                                    <div className="flex py-2">
                                                        <span className="text-text-secondary w-30">
                                                            Weight:
                                                        </span>
                                                        <span className="text-text-primary">
                                                            {
                                                                selectedVariant.weight
                                                            }
                                                            g
                                                        </span>
                                                    </div>
                                                )}
                                                {selectedVariant.dimensions
                                                    ?.length && (
                                                    <div className="flex py-2">
                                                        <span className="text-text-secondary w-30">
                                                            Dimensions:
                                                        </span>
                                                        <span className="text-text-primary">
                                                            {
                                                                selectedVariant
                                                                    .dimensions
                                                                    .length
                                                            }
                                                            {selectedVariant
                                                                .dimensions
                                                                .width &&
                                                                ` x ${selectedVariant.dimensions.width}`}
                                                            {selectedVariant
                                                                .dimensions
                                                                .height &&
                                                                ` x ${selectedVariant.dimensions.height}`}{" "}
                                                            cm
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-text-secondary">
                                                Select a variant to view
                                                specifications.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Stone Details Section */}
                            <div className="border border-divider rounded-sm">
                                <button
                                    onClick={() =>
                                        toggleSection("stone-details")
                                    }
                                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                                >
                                    <span className="text-sm font-medium text-text-primary">
                                        Stone Details
                                    </span>
                                    <FiChevronDown
                                        className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${
                                            expandedSections.includes(
                                                "stone-details",
                                            )
                                                ? "rotate-180"
                                                : ""
                                        }`}
                                    />
                                </button>
                                {expandedSections.includes("stone-details") && (
                                    <div className="px-4 pb-4 text-sm text-text-secondary leading-relaxed border-t border-divider pt-4">
                                        <p>
                                            Stone details information will be
                                            displayed here.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Care Instructions Section */}
                            <div className="border border-divider rounded-sm">
                                <button
                                    onClick={() => toggleSection("care")}
                                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                                >
                                    <span className="text-sm font-medium text-text-primary">
                                        Care Instructions
                                    </span>
                                    <FiChevronDown
                                        className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${
                                            expandedSections.includes("care")
                                                ? "rotate-180"
                                                : ""
                                        }`}
                                    />
                                </button>
                                {expandedSections.includes("care") && (
                                    <div className="px-4 pb-4 text-sm text-text-secondary leading-relaxed border-t border-divider pt-4 space-y-3">
                                        <p>
                                            • Store in a cool, dry place away
                                            from direct sunlight.
                                        </p>
                                        <p>
                                            • Clean gently with a soft cloth
                                            after each use.
                                        </p>
                                        <p>
                                            • Avoid contact with perfumes,
                                            cosmetics, and harsh chemicals.
                                        </p>
                                        <p>
                                            • Remove jewelry before bathing,
                                            swimming, or exercising.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews Section - Separate from tabs */}
                <div className="mt-12 max-w-[90vw] mx-auto">
                    <ProductReviews
                        productId={product._id}
                        productSlug={slug}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
