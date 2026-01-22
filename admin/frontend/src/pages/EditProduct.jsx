import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MdArrowBack, MdSave, MdAdd, MdDelete, MdImage } from "react-icons/md";
import {
    getProductById,
    updateProduct,
    uploadVariantImages,
    deleteVariantImages,
} from "../api/products.api";
import { getAllCategories } from "../api/categories.api";
import { handleApiError } from "../utils/axios";
import logger from "../utils/logger.util";
import Loader from "../components/common/Loader";

const EditProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [fetchingProduct, setFetchingProduct] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Categories and subcategories
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    // Product form data
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        shortDescription: "",
        category: "",
        subcategory: "",
        purity: "925",
        makingChargesPerGram: "",
        gstRate: "3",
        isFeatured: false,
        tags: [],
        gender: "",
        occasion: "",
        gemstone: "",
        plating: "",
        // Hallmark
        isHallmarked: false,
        bisLicenseNumber: "",
        hallmarkingCenter: "",
        purityCertified: "925",
        // SEO
        metaTitle: "",
        metaDescription: "",
        metaKeywords: [],
    });

    // Existing images from server
    const [existingImages, setExistingImages] = useState([]);
    const [imagesToDelete, setImagesToDelete] = useState([]);

    // New images to upload
    const [newImages, setNewImages] = useState([]);
    const [newImagePreviews, setNewImagePreviews] = useState([]);

    // Variants
    const [variants, setVariants] = useState([]);
    const [variantsToDelete, setVariantsToDelete] = useState([]);

    // Tag/keyword input
    const [tagInput, setTagInput] = useState("");
    const [keywordInput, setKeywordInput] = useState("");

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoadingCategories(true);
                const response = await getAllCategories();
                if (response.success) {
                    setCategories(response.data);
                    logger.debug("Categories loaded:", response.data);
                }
            } catch (err) {
                logger.error("Error fetching categories:", err);
                setError("Failed to load categories");
            } finally {
                setLoadingCategories(false);
            }
        };

        fetchCategories();
    }, []);

    // Update subcategories when category changes
    useEffect(() => {
        if (formData.category) {
            const selectedCategory = categories.find(
                (cat) => cat._id === formData.category,
            );
            if (selectedCategory && selectedCategory.subcategories) {
                setSubcategories(selectedCategory.subcategories);
            } else {
                setSubcategories([]);
            }
        } else {
            setSubcategories([]);
        }
    }, [formData.category, categories]);

    // Fetch existing product data
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setFetchingProduct(true);
                setError(null);

                logger.debug("Fetching product for edit:", id);

                const response = await getProductById(id);

                if (response.success) {
                    const product = response.data;

                    // Populate form data
                    setFormData({
                        name: product.name || "",
                        description: product.description || "",
                        shortDescription: product.shortDescription || "",
                        category: product.category?._id || "",
                        subcategory: product.subcategory?._id || "",
                        purity: product.purity || "925",
                        makingChargesPerGram:
                            product.makingChargesPerGram || "",
                        gstRate: product.gstRate || "3",
                        isFeatured: product.isFeatured || false,
                        tags: product.tags || [],
                        gender: product.attributes?.gender || "",
                        occasion: product.attributes?.occasion || "",
                        gemstone: product.attributes?.gemstone || "",
                        plating: product.attributes?.plating || "",
                        isHallmarked: product.hallmark?.isHallmarked || false,
                        bisLicenseNumber:
                            product.hallmark?.bisLicenseNumber || "",
                        hallmarkingCenter:
                            product.hallmark?.hallmarkingCenter || "",
                        purityCertified:
                            product.hallmark?.purityCertified || "925",
                        metaTitle: product.seo?.metaTitle || "",
                        metaDescription: product.seo?.metaDescription || "",
                        metaKeywords: product.seo?.metaKeywords || [],
                    });

                    // Set existing images
                    setExistingImages(product.images || []);

                    // Set variants
                    if (product.variants && product.variants.length > 0) {
                        setVariants(
                            product.variants.map((v) => ({
                                _id: v._id,
                                variantName: v.variantName || "",
                                weight: v.weight || "",
                                sellingPrice: v.sellingPrice || "",
                                mrp: v.mrp || "",
                                costPrice: v.costPrice || "",
                                stockQuantity: v.stockQuantity || "0",
                                lowStockThreshold: v.lowStockThreshold || "5",
                                attributes: v.attributes || [],
                                dimensions: {
                                    length: v.dimensions?.length || "",
                                    width: v.dimensions?.width || "",
                                    height: v.dimensions?.height || "",
                                },
                                existingImages: v.images || [],
                                imagesToDelete: [],
                                newImages: [],
                                newImagePreviews: [],
                            })),
                        );
                    }

                    logger.debug("Product data loaded for edit:", product);
                }
            } catch (err) {
                logger.error("Error fetching product for edit:", err);
                const errorMessage = handleApiError(err);
                setError(errorMessage);
            } finally {
                setFetchingProduct(false);
            }
        };

        fetchProduct();
    }, [id]);

    // Handle form input change
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    // Remove existing image
    const removeExistingImage = (publicId) => {
        setImagesToDelete((prev) => [...prev, publicId]);
        setExistingImages((prev) =>
            prev.filter((img) => img.publicId !== publicId),
        );
    };

    // Handle new image upload
    const handleNewImageChange = (e) => {
        const files = Array.from(e.target.files);

        const totalImages =
            existingImages.length + newImages.length + files.length;
        if (totalImages > 5) {
            setError("Maximum 5 images allowed for product");
            return;
        }

        setNewImages((prev) => [...prev, ...files]);

        // Create previews
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewImagePreviews((prev) => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });

        setError(null);
    };

    // Remove new image
    const removeNewImage = (index) => {
        setNewImages((prev) => prev.filter((_, i) => i !== index));
        setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    // Add tag
    const addTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData((prev) => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()],
            }));
            setTagInput("");
        }
    };

    // Remove tag
    const removeTag = (index) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((_, i) => i !== index),
        }));
    };

    // Add keyword
    const addKeyword = () => {
        if (
            keywordInput.trim() &&
            !formData.metaKeywords.includes(keywordInput.trim())
        ) {
            setFormData((prev) => ({
                ...prev,
                metaKeywords: [...prev.metaKeywords, keywordInput.trim()],
            }));
            setKeywordInput("");
        }
    };

    // Remove keyword
    const removeKeyword = (index) => {
        setFormData((prev) => ({
            ...prev,
            metaKeywords: prev.metaKeywords.filter((_, i) => i !== index),
        }));
    };

    // Handle variant change
    const handleVariantChange = (index, field, value) => {
        setVariants((prev) => {
            const updated = [...prev];

            // Handle nested fields (dimensions)
            if (field.includes(".")) {
                const [parent, child] = field.split(".");
                updated[index] = {
                    ...updated[index],
                    [parent]: {
                        ...updated[index][parent],
                        [child]: value,
                    },
                };
            } else {
                updated[index] = {
                    ...updated[index],
                    [field]: value,
                };
            }

            return updated;
        });
    };

    // Add variant attribute
    const addVariantAttribute = (variantIndex) => {
        setVariants((prev) => {
            const updated = [...prev];
            if (!updated[variantIndex].attributes) {
                updated[variantIndex].attributes = [];
            }
            updated[variantIndex].attributes.push({ key: "", value: "" });
            return updated;
        });
    };

    // Remove variant attribute
    const removeVariantAttribute = (variantIndex, attrIndex) => {
        setVariants((prev) => {
            const updated = [...prev];
            updated[variantIndex].attributes = updated[
                variantIndex
            ].attributes.filter((_, i) => i !== attrIndex);
            return updated;
        });
    };

    // Handle variant attribute change
    const handleVariantAttributeChange = (
        variantIndex,
        attrIndex,
        field,
        value,
    ) => {
        setVariants((prev) => {
            const updated = [...prev];
            updated[variantIndex].attributes[attrIndex][field] = value;
            return updated;
        });
    };

    // Remove existing variant image
    const removeExistingVariantImage = (variantIndex, publicId) => {
        setVariants((prev) => {
            const updated = [...prev];
            updated[variantIndex].imagesToDelete = [
                ...updated[variantIndex].imagesToDelete,
                publicId,
            ];
            updated[variantIndex].existingImages = updated[
                variantIndex
            ].existingImages.filter((img) => img.publicId !== publicId);
            return updated;
        });
    };

    // Handle new variant image upload
    const handleVariantImageChange = (variantIndex, e) => {
        const files = Array.from(e.target.files);
        const variant = variants[variantIndex];

        const totalImages =
            variant.existingImages.length +
            variant.newImages.length +
            files.length;
        if (totalImages > 5) {
            setError(`Maximum 5 images allowed per variant`);
            return;
        }

        setVariants((prev) => {
            const updated = [...prev];
            updated[variantIndex].newImages = [
                ...updated[variantIndex].newImages,
                ...files,
            ];
            return updated;
        });

        // Create previews
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setVariants((prev) => {
                    const updated = [...prev];
                    updated[variantIndex].newImagePreviews = [
                        ...updated[variantIndex].newImagePreviews,
                        reader.result,
                    ];
                    return updated;
                });
            };
            reader.readAsDataURL(file);
        });

        setError(null);
    };

    // Remove new variant image
    const removeNewVariantImage = (variantIndex, imageIndex) => {
        setVariants((prev) => {
            const updated = [...prev];
            updated[variantIndex].newImages = updated[
                variantIndex
            ].newImages.filter((_, i) => i !== imageIndex);
            updated[variantIndex].newImagePreviews = updated[
                variantIndex
            ].newImagePreviews.filter((_, i) => i !== imageIndex);
            return updated;
        });
    };

    // Add new variant
    const addVariant = () => {
        setVariants((prev) => [
            ...prev,
            {
                variantName: "",
                weight: "",
                sellingPrice: "",
                mrp: "",
                costPrice: "",
                stockQuantity: "0",
                lowStockThreshold: "5",
                attributes: [],
                dimensions: {
                    length: "",
                    width: "",
                    height: "",
                },
                existingImages: [],
                imagesToDelete: [],
                newImages: [],
                newImagePreviews: [],
            },
        ]);
    };

    // Remove variant
    const removeVariant = (index) => {
        const variant = variants[index];

        // If variant has _id, it's an existing variant - add to delete list
        if (variant._id) {
            setVariantsToDelete((prev) => [...prev, variant._id]);
        }

        setVariants((prev) => prev.filter((_, i) => i !== index));
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError(null);

            // Validate
            const totalImages = existingImages.length + newImages.length;
            if (totalImages === 0) {
                setError("At least one product image is required");
                setLoading(false);
                return;
            }

            if (variants.length === 0 || !variants[0].variantName) {
                setError("At least one variant is required");
                setLoading(false);
                return;
            }

            // Create FormData
            const data = new FormData();

            // Add product fields
            data.append("name", formData.name);
            data.append("description", formData.description);
            if (formData.shortDescription)
                data.append("shortDescription", formData.shortDescription);
            data.append("category", formData.category);
            if (formData.subcategory)
                data.append("subcategory", formData.subcategory);
            data.append("purity", formData.purity);
            data.append("makingChargesPerGram", formData.makingChargesPerGram);
            data.append("gstRate", formData.gstRate);
            data.append("isFeatured", formData.isFeatured);

            // Add tags as JSON string
            if (formData.tags.length > 0) {
                data.append("tags", JSON.stringify(formData.tags));
            }

            // Add attributes
            const attributes = {};
            if (formData.gender) attributes.gender = formData.gender;
            if (formData.occasion) attributes.occasion = formData.occasion;
            if (formData.gemstone) attributes.gemstone = formData.gemstone;
            if (formData.plating) attributes.plating = formData.plating;

            if (Object.keys(attributes).length > 0) {
                data.append("attributes", JSON.stringify(attributes));
            }

            // Add hallmark data
            if (formData.isHallmarked) {
                const hallmark = {
                    isHallmarked: true,
                    bisLicenseNumber: formData.bisLicenseNumber,
                    hallmarkingCenter: formData.hallmarkingCenter,
                    purityCertified: formData.purityCertified,
                };
                data.append("hallmark", JSON.stringify(hallmark));
            }

            // Add SEO data
            if (
                formData.metaTitle ||
                formData.metaDescription ||
                formData.metaKeywords.length > 0
            ) {
                const seo = {};
                if (formData.metaTitle) seo.metaTitle = formData.metaTitle;
                if (formData.metaDescription)
                    seo.metaDescription = formData.metaDescription;
                if (formData.metaKeywords.length > 0)
                    seo.metaKeywords = formData.metaKeywords;
                data.append("seo", JSON.stringify(seo));
            }

            // Add images to delete
            if (imagesToDelete.length > 0) {
                data.append("deleteImages", JSON.stringify(imagesToDelete));
            }

            // Add new images
            newImages.forEach((image) => {
                data.append("images", image);
            });

            // Prepare variants (remove empty attributes and dimensions)
            const cleanedVariants = variants.map((v) => {
                const variant = {
                    variantName: v.variantName,
                    weight: parseFloat(v.weight),
                    sellingPrice: parseFloat(v.sellingPrice),
                    stockQuantity: parseInt(v.stockQuantity) || 0,
                    lowStockThreshold: parseInt(v.lowStockThreshold) || 5,
                };

                // Include _id if updating existing variant
                if (v._id) variant._id = v._id;

                if (v.mrp) variant.mrp = parseFloat(v.mrp);
                if (v.costPrice) variant.costPrice = parseFloat(v.costPrice);

                // Add non-empty attributes
                if (v.attributes && v.attributes.length > 0) {
                    const validAttrs = v.attributes.filter(
                        (attr) => attr.key && attr.value,
                    );
                    if (validAttrs.length > 0) {
                        variant.attributes = validAttrs;
                    }
                }

                // Add non-empty dimensions
                if (
                    v.dimensions.length ||
                    v.dimensions.width ||
                    v.dimensions.height
                ) {
                    variant.dimensions = {};
                    if (v.dimensions.length)
                        variant.dimensions.length = parseFloat(
                            v.dimensions.length,
                        );
                    if (v.dimensions.width)
                        variant.dimensions.width = parseFloat(
                            v.dimensions.width,
                        );
                    if (v.dimensions.height)
                        variant.dimensions.height = parseFloat(
                            v.dimensions.height,
                        );
                }

                return variant;
            });

            // Add variants as JSON string
            data.append("variants", JSON.stringify(cleanedVariants));

            // Add variants to delete
            if (variantsToDelete.length > 0) {
                data.append("deleteVariants", JSON.stringify(variantsToDelete));
            }

            logger.debug(
                "Submitting product update:",
                Object.fromEntries(data),
            );

            const response = await updateProduct(id, data);

            if (response.success) {
                const product = response.data;
                logger.info("Product updated successfully:", product);

                // Handle variant images (upload/delete)
                if (product.variants && product.variants.length > 0) {
                    for (let i = 0; i < product.variants.length; i++) {
                        const variant = product.variants[i];
                        const variantData = variants.find(
                            (v) => v._id === variant._id,
                        );

                        if (variantData) {
                            // Delete variant images if any
                            if (
                                variantData.imagesToDelete &&
                                variantData.imagesToDelete.length > 0
                            ) {
                                try {
                                    await deleteVariantImages(
                                        variant._id,
                                        variantData.imagesToDelete,
                                    );
                                    logger.debug(
                                        `Deleted ${variantData.imagesToDelete.length} images from variant ${variant._id}`,
                                    );
                                } catch (imgErr) {
                                    logger.error(
                                        `Error deleting variant images:`,
                                        imgErr,
                                    );
                                }
                            }

                            // Upload new variant images if any
                            if (
                                variantData.newImages &&
                                variantData.newImages.length > 0
                            ) {
                                try {
                                    const variantImageData = new FormData();
                                    variantData.newImages.forEach((img) => {
                                        variantImageData.append("images", img);
                                    });

                                    await uploadVariantImages(
                                        variant._id,
                                        variantImageData,
                                    );
                                    logger.debug(
                                        `Uploaded ${variantData.newImages.length} images for variant ${variant._id}`,
                                    );
                                } catch (imgErr) {
                                    logger.error(
                                        `Error uploading variant images:`,
                                        imgErr,
                                    );
                                }
                            }
                        }
                    }
                }

                setSuccess(true);

                // Redirect to product detail page
                setTimeout(() => {
                    navigate(`/products/${id}`);
                }, 1500);
            }
        } catch (err) {
            logger.error("Error updating product:", err);
            const errorMessage = handleApiError(err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (fetchingProduct) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader />
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
                <h1 className="text-3xl font-bold text-text">Edit Product</h1>
                <div className="w-20"></div> {/* Spacer for centering */}
            </div>

            {/* Success Message */}
            {success && (
                <div className="bg-success/10 bg-opacity-10 border border-success text-success px-4 py-3 rounded-lg">
                    Product updated successfully! Redirecting...
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-danger/10 bg-opacity-10 border border-danger text-danger px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-surface rounded-lg shadow-md p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-text border-b border-border pb-2">
                        Basic Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Product Name */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-text mb-1">
                                Product Name{" "}
                                <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-text mb-1">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows="4"
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        {/* Short Description */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-text mb-1">
                                Short Description (Max 500 chars)
                            </label>
                            <textarea
                                name="shortDescription"
                                value={formData.shortDescription}
                                onChange={handleInputChange}
                                maxLength="500"
                                rows="2"
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <p className="text-xs text-text-secondary mt-1">
                                {formData.shortDescription.length}/500
                                characters
                            </p>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Category <span className="text-danger">*</span>
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                required
                                disabled={loadingCategories}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                            >
                                <option value="">Select Category</option>
                                {categories.map((cat) => (
                                    <option key={cat._id} value={cat._id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Subcategory */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Subcategory
                            </label>
                            <select
                                name="subcategory"
                                value={formData.subcategory}
                                onChange={handleInputChange}
                                disabled={
                                    !formData.category ||
                                    subcategories.length === 0
                                }
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                            >
                                <option value="">
                                    Select Subcategory (Optional)
                                </option>
                                {subcategories.map((subcat) => (
                                    <option key={subcat._id} value={subcat._id}>
                                        {subcat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Purity */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Purity <span className="text-danger">*</span>
                            </label>
                            <select
                                name="purity"
                                value={formData.purity}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="925">
                                    925 (Sterling Silver)
                                </option>
                                <option value="999">999 (Pure Silver)</option>
                            </select>
                        </div>

                        {/* Making Charges Per Gram */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Making Charges Per Gram (₹){" "}
                                <span className="text-danger">*</span>
                            </label>
                            <input
                                type="number"
                                name="makingChargesPerGram"
                                value={formData.makingChargesPerGram}
                                onChange={handleInputChange}
                                required
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        {/* GST Rate */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                GST Rate (%){" "}
                                <span className="text-danger">*</span>
                            </label>
                            <input
                                type="number"
                                name="gstRate"
                                value={formData.gstRate}
                                onChange={handleInputChange}
                                required
                                min="0"
                                max="100"
                                step="0.01"
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        {/* Featured */}
                        <div className="md:col-span-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isFeatured"
                                    checked={formData.isFeatured}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
                                />
                                <span className="text-sm font-medium text-text">
                                    Mark as Featured Product
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Product Images */}
                <div className="bg-surface rounded-lg shadow-md p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-text border-b border-border pb-2">
                        Product Images <span className="text-danger">*</span>
                    </h2>

                    <div className="space-y-4">
                        {/* Existing Images */}
                        {existingImages.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-text mb-2">
                                    Existing Images ({existingImages.length})
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    {existingImages.map((image, index) => (
                                        <div
                                            key={image.publicId}
                                            className="relative group"
                                        >
                                            <img
                                                src={image.url}
                                                alt={`Product ${index + 1}`}
                                                className="w-full aspect-square object-cover rounded-lg border border-border"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeExistingImage(
                                                        image.publicId,
                                                    )
                                                }
                                                className="absolute top-2 right-2 bg-danger text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <MdDelete size={16} />
                                            </button>
                                            {image.isPrimary && (
                                                <span className="absolute bottom-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                                                    Primary
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Upload New Images */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-2">
                                Add New Images
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleNewImageChange}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <p className="text-xs text-text-secondary mt-1">
                                Total:{" "}
                                {existingImages.length + newImages.length}/5
                                images
                            </p>
                        </div>

                        {/* New Image Previews */}
                        {newImagePreviews.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-text mb-2">
                                    New Images to Upload ({newImages.length})
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    {newImagePreviews.map((preview, index) => (
                                        <div
                                            key={index}
                                            className="relative group"
                                        >
                                            <img
                                                src={preview}
                                                alt={`New ${index + 1}`}
                                                className="w-full aspect-square object-cover rounded-lg border  border-border"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeNewImage(index)
                                                }
                                                className="absolute top-2 right-2 bg-danger text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <MdDelete size={16} />
                                            </button>
                                            <span className="absolute bottom-2 left-2 bg-info text-white text-xs px-2 py-1 rounded">
                                                New
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Attributes */}
                <div className="bg-surface rounded-lg shadow-md p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-text border-b border-border pb-2">
                        Attributes
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Gender */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Gender
                            </label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Select Gender</option>
                                <option value="men">Men</option>
                                <option value="women">Women</option>
                                <option value="unisex">Unisex</option>
                            </select>
                        </div>

                        {/* Occasion */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Occasion
                            </label>
                            <input
                                type="text"
                                name="occasion"
                                value={formData.occasion}
                                onChange={handleInputChange}
                                placeholder="e.g., Daily Wear, Wedding, Party"
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        {/* Gemstone */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Gemstone
                            </label>
                            <input
                                type="text"
                                name="gemstone"
                                value={formData.gemstone}
                                onChange={handleInputChange}
                                placeholder="e.g., Diamond, Ruby, Emerald"
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        {/* Plating */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Plating
                            </label>
                            <input
                                type="text"
                                name="plating"
                                value={formData.plating}
                                onChange={handleInputChange}
                                placeholder="e.g., Gold Plated, Rhodium Plated"
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-text mb-1">
                            Tags
                        </label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) =>
                                    e.key === "Enter" &&
                                    (e.preventDefault(), addTag())
                                }
                                placeholder="Add a tag and press Enter"
                                className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <button
                                type="button"
                                onClick={addTag}
                                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
                            >
                                Add
                            </button>
                        </div>

                        {formData.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {formData.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-background text-text"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(index)}
                                            className="text-danger hover:text-opacity-80"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Hallmark Information */}
                <div className="bg-surface rounded-lg shadow-md p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-text border-b border-border pb-2">
                        Hallmark Information
                    </h2>

                    <div className="space-y-4">
                        {/* Is Hallmarked */}
                        <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isHallmarked"
                                    checked={formData.isHallmarked}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
                                />
                                <span className="text-sm font-medium text-text">
                                    Product is Hallmarked
                                </span>
                            </label>
                        </div>

                        {formData.isHallmarked && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                                {/* BIS License Number */}
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        BIS License Number
                                    </label>
                                    <input
                                        type="text"
                                        name="bisLicenseNumber"
                                        value={formData.bisLicenseNumber}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                {/* Hallmarking Center */}
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Hallmarking Center
                                    </label>
                                    <input
                                        type="text"
                                        name="hallmarkingCenter"
                                        value={formData.hallmarkingCenter}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                {/* Purity Certified */}
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Purity Certified
                                    </label>
                                    <select
                                        name="purityCertified"
                                        value={formData.purityCertified}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="925">925</option>
                                        <option value="999">999</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Variants */}
                <div className="bg-surface rounded-lg shadow-md p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                        <h2 className="text-xl font-semibold text-text">
                            Product Variants{" "}
                            <span className="text-danger">*</span>
                        </h2>
                        <button
                            type="button"
                            onClick={addVariant}
                            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
                        >
                            <MdAdd size={20} />
                            Add Variant
                        </button>
                    </div>

                    {variants.map((variant, vIndex) => (
                        <div
                            key={vIndex}
                            className="border border-border rounded-lg p-4 space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-text">
                                    Variant {vIndex + 1}
                                    {variant._id && (
                                        <span className="ml-2 text-xs text-info">
                                            (Existing)
                                        </span>
                                    )}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => removeVariant(vIndex)}
                                    className="text-danger hover:text-opacity-80 transition-colors"
                                >
                                    <MdDelete size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Variant Name */}
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Variant Name{" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={variant.variantName}
                                        onChange={(e) =>
                                            handleVariantChange(
                                                vIndex,
                                                "variantName",
                                                e.target.value,
                                            )
                                        }
                                        required
                                        placeholder="e.g., Size 7"
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                {/* Weight */}
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Weight (grams){" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={variant.weight}
                                        onChange={(e) =>
                                            handleVariantChange(
                                                vIndex,
                                                "weight",
                                                e.target.value,
                                            )
                                        }
                                        required
                                        min="0.01"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                {/* Selling Price */}
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Selling Price (₹){" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={variant.sellingPrice}
                                        onChange={(e) =>
                                            handleVariantChange(
                                                vIndex,
                                                "sellingPrice",
                                                e.target.value,
                                            )
                                        }
                                        required
                                        min="0"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                {/* MRP */}
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        MRP (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={variant.mrp}
                                        onChange={(e) =>
                                            handleVariantChange(
                                                vIndex,
                                                "mrp",
                                                e.target.value,
                                            )
                                        }
                                        min="0"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                {/* Cost Price */}
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Cost Price (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={variant.costPrice}
                                        onChange={(e) =>
                                            handleVariantChange(
                                                vIndex,
                                                "costPrice",
                                                e.target.value,
                                            )
                                        }
                                        min="0"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                {/* Stock Quantity */}
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Stock Quantity
                                    </label>
                                    <input
                                        type="number"
                                        value={variant.stockQuantity}
                                        onChange={(e) =>
                                            handleVariantChange(
                                                vIndex,
                                                "stockQuantity",
                                                e.target.value,
                                            )
                                        }
                                        min="0"
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                {/* Low Stock Threshold */}
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Low Stock Threshold
                                    </label>
                                    <input
                                        type="number"
                                        value={variant.lowStockThreshold}
                                        onChange={(e) =>
                                            handleVariantChange(
                                                vIndex,
                                                "lowStockThreshold",
                                                e.target.value,
                                            )
                                        }
                                        min="0"
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            {/* Dimensions */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Length (cm)
                                    </label>
                                    <input
                                        type="number"
                                        value={variant.dimensions.length}
                                        onChange={(e) =>
                                            handleVariantChange(
                                                vIndex,
                                                "dimensions.length",
                                                e.target.value,
                                            )
                                        }
                                        min="0"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Width (cm)
                                    </label>
                                    <input
                                        type="number"
                                        value={variant.dimensions.width}
                                        onChange={(e) =>
                                            handleVariantChange(
                                                vIndex,
                                                "dimensions.width",
                                                e.target.value,
                                            )
                                        }
                                        min="0"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Height (cm)
                                    </label>
                                    <input
                                        type="number"
                                        value={variant.dimensions.height}
                                        onChange={(e) =>
                                            handleVariantChange(
                                                vIndex,
                                                "dimensions.height",
                                                e.target.value,
                                            )
                                        }
                                        min="0"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            {/* Variant Attributes */}
                            <div className="pt-4 border-t border-border">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-text">
                                        Attributes (e.g., size, color)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            addVariantAttribute(vIndex)
                                        }
                                        className="text-primary hover:text-opacity-80 text-sm"
                                    >
                                        + Add Attribute
                                    </button>
                                </div>

                                {variant.attributes &&
                                variant.attributes.length > 0 ? (
                                    <div className="space-y-2">
                                        {variant.attributes.map(
                                            (attr, aIndex) => (
                                                <div
                                                    key={aIndex}
                                                    className="flex gap-2"
                                                >
                                                    <input
                                                        type="text"
                                                        value={attr.key}
                                                        onChange={(e) =>
                                                            handleVariantAttributeChange(
                                                                vIndex,
                                                                aIndex,
                                                                "key",
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Key (e.g., size)"
                                                        className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={attr.value}
                                                        onChange={(e) =>
                                                            handleVariantAttributeChange(
                                                                vIndex,
                                                                aIndex,
                                                                "value",
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Value (e.g., 7)"
                                                        className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeVariantAttribute(
                                                                vIndex,
                                                                aIndex,
                                                            )
                                                        }
                                                        className="text-danger hover:text-opacity-80 p-2"
                                                    >
                                                        <MdDelete size={20} />
                                                    </button>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-text-secondary">
                                        No attributes added
                                    </p>
                                )}
                            </div>

                            {/* Variant Images */}
                            <div className="pt-4 border-t border-border space-y-3">
                                <label className="block text-sm font-medium text-text">
                                    Variant Images (Optional, max 5)
                                </label>

                                {/* Existing Variant Images */}
                                {variant.existingImages &&
                                    variant.existingImages.length > 0 && (
                                        <div>
                                            <p className="text-xs text-text-secondary mb-2">
                                                Existing Images (
                                                {variant.existingImages.length})
                                            </p>
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                                {variant.existingImages.map(
                                                    (img, imgIndex) => (
                                                        <div
                                                            key={img.publicId}
                                                            className="relative group"
                                                        >
                                                            <img
                                                                src={img.url}
                                                                alt={`Variant ${vIndex + 1} Image ${imgIndex + 1}`}
                                                                className="w-full aspect-square object-cover rounded-lg border border-border"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeExistingVariantImage(
                                                                        vIndex,
                                                                        img.publicId,
                                                                    )
                                                                }
                                                                className="absolute top-1 right-1 bg-danger text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <MdDelete
                                                                    size={14}
                                                                />
                                                            </button>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    )}

                                {/* Upload New Variant Images */}
                                <div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) =>
                                            handleVariantImageChange(vIndex, e)
                                        }
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                    />
                                    <p className="text-xs text-text-secondary mt-1">
                                        Total:{" "}
                                        {(variant.existingImages?.length || 0) +
                                            (variant.newImages?.length || 0)}
                                        /5 images
                                    </p>
                                </div>

                                {/* New Variant Image Previews */}
                                {variant.newImagePreviews &&
                                    variant.newImagePreviews.length > 0 && (
                                        <div>
                                            <p className="text-xs text-text-secondary mb-2">
                                                New Images to Upload (
                                                {variant.newImages.length})
                                            </p>
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                                {variant.newImagePreviews.map(
                                                    (preview, imgIndex) => (
                                                        <div
                                                            key={imgIndex}
                                                            className="relative group"
                                                        >
                                                            <img
                                                                src={preview}
                                                                alt={`New Variant ${vIndex + 1} Image ${imgIndex + 1}`}
                                                                className="w-full aspect-square object-cover rounded-lg border border-border"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeNewVariantImage(
                                                                        vIndex,
                                                                        imgIndex,
                                                                    )
                                                                }
                                                                className="absolute top-1 right-1 bg-danger text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <MdDelete
                                                                    size={14}
                                                                />
                                                            </button>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* SEO Information */}
                <div className="bg-surface rounded-lg shadow-md p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-text border-b border-border pb-2">
                        SEO Information
                    </h2>

                    <div className="space-y-4">
                        {/* Meta Title */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Meta Title
                            </label>
                            <input
                                type="text"
                                name="metaTitle"
                                value={formData.metaTitle}
                                onChange={handleInputChange}
                                placeholder="SEO optimized title"
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        {/* Meta Description */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Meta Description
                            </label>
                            <textarea
                                name="metaDescription"
                                value={formData.metaDescription}
                                onChange={handleInputChange}
                                rows="3"
                                placeholder="SEO optimized description"
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        {/* Meta Keywords */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Meta Keywords
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={keywordInput}
                                    onChange={(e) =>
                                        setKeywordInput(e.target.value)
                                    }
                                    onKeyPress={(e) =>
                                        e.key === "Enter" &&
                                        (e.preventDefault(), addKeyword())
                                    }
                                    placeholder="Add a keyword and press Enter"
                                    className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <button
                                    type="button"
                                    onClick={addKeyword}
                                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
                                >
                                    Add
                                </button>
                            </div>

                            {formData.metaKeywords.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {formData.metaKeywords.map(
                                        (keyword, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-background text-text"
                                            >
                                                {keyword}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeKeyword(index)
                                                    }
                                                    className="text-danger hover:text-opacity-80"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ),
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-6 py-2 border border-border rounded-lg hover:bg-background transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader size="sm" variant="white" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <MdSave size={20} />
                                Update Product
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProduct;
