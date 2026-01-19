import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowBack, MdSave, MdAdd, MdDelete, MdImage } from "react-icons/md";
import { createProduct } from "../api/products.api";
import { handleApiError } from "../utils/axios";
import logger from "../utils/logger.util";
import Loader from "../components/common/Loader";

const AddProduct = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

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

    // Images
    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    // Variants
    const [variants, setVariants] = useState([
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
        },
    ]);

    // Tag input
    const [tagInput, setTagInput] = useState("");
    const [keywordInput, setKeywordInput] = useState("");

    // Handle form input change
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    // Handle image upload
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);

        if (images.length + files.length > 10) {
            setError("Maximum 10 images allowed");
            return;
        }

        setImages((prev) => [...prev, ...files]);

        // Create previews
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews((prev) => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });

        setError(null);
    };

    // Remove image
    const removeImage = (index) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
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

    // Add variant
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
            },
        ]);
    };

    // Remove variant
    const removeVariant = (index) => {
        if (variants.length > 1) {
            setVariants((prev) => prev.filter((_, i) => i !== index));
        }
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError(null);

            // Validate
            if (images.length === 0) {
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

            // Add images
            images.forEach((image) => {
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

            logger.debug(
                "Submitting product creation:",
                Object.fromEntries(data),
            );

            const response = await createProduct(data);

            if (response.success) {
                setSuccess(true);
                logger.info("Product created successfully:", response.data);

                // Redirect to product detail page
                setTimeout(() => {
                    navigate(`/products/${response.data._id}`);
                }, 1500);
            }
        } catch (err) {
            logger.error("Error creating product:", err);
            const errorMessage = handleApiError(err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

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
                <h1 className="text-3xl font-bold text-text">
                    Add New Product
                </h1>
                <div className="w-20"></div> {/* Spacer for centering */}
            </div>

            {/* Success Message */}
            {success && (
                <div className="bg-success bg-opacity-10 border border-success text-success px-4 py-3 rounded-lg">
                    Product created successfully! Redirecting...
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-danger bg-opacity-10 border border-danger text-danger px-4 py-3 rounded-lg">
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
                            <input
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                required
                                placeholder="Category ID"
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <p className="text-xs text-text-secondary mt-1">
                                Enter the category ObjectId
                            </p>
                        </div>

                        {/* Subcategory */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Subcategory
                            </label>
                            <input
                                type="text"
                                name="subcategory"
                                value={formData.subcategory}
                                onChange={handleInputChange}
                                placeholder="Subcategory ID (Optional)"
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
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
                        <div>
                            <label className="block text-sm font-medium text-text mb-2">
                                Upload Images (1-10 images required)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <p className="text-xs text-text-secondary mt-1">
                                {images.length}/10 images uploaded
                            </p>
                        </div>

                        {/* Image Previews */}
                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={preview}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg border border-border"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-2 right-2 bg-danger text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <MdDelete size={16} />
                                        </button>
                                        {index === 0 && (
                                            <span className="absolute bottom-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                                                Primary
                                            </span>
                                        )}
                                    </div>
                                ))}
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
                                </h3>
                                {variants.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeVariant(vIndex)}
                                        className="text-danger hover:text-opacity-80 transition-colors"
                                    >
                                        <MdDelete size={20} />
                                    </button>
                                )}
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

                                {variant.attributes.length > 0 ? (
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
                                Creating...
                            </>
                        ) : (
                            <>
                                <MdSave size={20} />
                                Create Product
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddProduct;
