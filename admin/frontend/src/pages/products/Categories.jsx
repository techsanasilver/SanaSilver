import { useState, useEffect } from "react";
import {
    MdAdd,
    MdEdit,
    MdDelete,
    MdExpandMore,
    MdExpandLess,
    MdCheckCircle,
    MdCancel,
    MdImage,
    MdSave,
    MdClose,
    MdSubdirectoryArrowRight,
} from "react-icons/md";
import {
    getAllCategories,
    getCategoryTree,
    createCategory,
    updateCategory,
    softDeleteCategory,
} from "../../api/categories.api";
import { handleApiError } from "../../utils/axios";
import logger from "../../utils/logger.util";
import Loader from "../../components/common/Loader";

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [editingCategory, setEditingCategory] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        parent: "",
        isActive: true,
        metaTitle: "",
        metaDescription: "",
        metaKeywords: "",
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Fetch categories
    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await getCategoryTree();
            setCategories(response.data || []);
        } catch (error) {
            handleApiError(error);
            logger.error("Failed to fetch categories:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Toggle category expansion
    const toggleCategory = (categoryId) => {
        setExpandedCategories((prev) => ({
            ...prev,
            [categoryId]: !prev[categoryId],
        }));
    };

    // Handle form input change
    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // Handle image change
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("Image size should be less than 5MB");
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    // Start adding new category
    const startAddCategory = () => {
        setFormData({
            name: "",
            description: "",
            parent: "",
            isActive: true,
            metaTitle: "",
            metaDescription: "",
            metaKeywords: "",
        });
        setImageFile(null);
        setImagePreview(null);
        setEditingCategory(null);
        setShowAddForm(true);
    };

    // Start editing category
    const startEditCategory = (category) => {
        setFormData({
            name: category.name || "",
            description: category.description || "",
            parent: category.parent?._id || "",
            isActive: category.isActive,
            metaTitle: category.metaTitle || "",
            metaDescription: category.metaDescription || "",
            metaKeywords: category.metaKeywords?.join(", ") || "",
        });
        setImageFile(null);
        setImagePreview(category.image?.urls?.medium || null);
        setEditingCategory(category._id);
        setShowAddForm(false);
    };

    // Cancel editing/adding
    const cancelForm = () => {
        setShowAddForm(false);
        setEditingCategory(null);
        setFormData({
            name: "",
            description: "",
            parent: "",
            isActive: true,
            metaTitle: "",
            metaDescription: "",
            metaKeywords: "",
        });
        setImageFile(null);
        setImagePreview(null);
    };

    // Submit form (create or update)
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert("Category name is required");
            return;
        }

        try {
            setSubmitting(true);

            const data = new FormData();
            data.append("name", formData.name.trim());
            data.append("description", formData.description.trim());
            data.append("isActive", formData.isActive);

            if (formData.parent) {
                data.append("parent", formData.parent);
            }

            if (formData.metaTitle) {
                data.append("metaTitle", formData.metaTitle.trim());
            }

            if (formData.metaDescription) {
                data.append("metaDescription", formData.metaDescription.trim());
            }

            if (formData.metaKeywords) {
                const keywords = formData.metaKeywords
                    .split(",")
                    .map((k) => k.trim())
                    .filter((k) => k);
                data.append("metaKeywords", JSON.stringify(keywords));
            }

            if (imageFile) {
                data.append("image", imageFile);
            }

            if (editingCategory) {
                await updateCategory(editingCategory, data);
                logger.info("Category updated successfully");
            } else {
                await createCategory(data);
                logger.info("Category created successfully");
            }

            await fetchCategories();
            cancelForm();
        } catch (error) {
            handleApiError(error);
            logger.error("Failed to save category:", error);
        } finally {
            setSubmitting(false);
        }
    };

    // Delete category
    const handleDelete = async (categoryId, categoryName) => {
        if (
            !window.confirm(
                `Are you sure you want to delete "${categoryName}"?`,
            )
        ) {
            return;
        }

        try {
            await softDeleteCategory(categoryId);
            logger.info("Category deleted successfully");
            await fetchCategories();
        } catch (error) {
            handleApiError(error);
            logger.error("Failed to delete category:", error);
        }
    };

    // Flatten categories for parent selector
    const flattenCategories = (cats, level = 0) => {
        let result = [];
        cats.forEach((cat) => {
            result.push({ ...cat, level });
            if (cat.children && cat.children.length > 0) {
                result = result.concat(
                    flattenCategories(cat.children, level + 1),
                );
            }
        });
        return result;
    };

    // Render category form
    const renderForm = () => {
        const flatCategories = flattenCategories(categories);

        return (
            <div className="bg-surface rounded-lg border-2 border-accent p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-text">
                        {editingCategory ? "Edit Category" : "Add New Category"}
                    </h3>
                    <button
                        onClick={cancelForm}
                        className="text-text-secondary hover:text-text transition-colors"
                    >
                        <MdClose size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Name <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) =>
                                    handleInputChange("name", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                                required
                            />
                        </div>

                        {/* Parent Category */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Parent Category
                            </label>
                            <select
                                value={formData.parent}
                                onChange={(e) =>
                                    handleInputChange("parent", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                            >
                                <option value="">None (Root Category)</option>
                                {flatCategories
                                    .filter(
                                        (cat) => cat._id !== editingCategory,
                                    )
                                    .map((cat) => (
                                        <option key={cat._id} value={cat._id}>
                                            {"—".repeat(cat.level)} {cat.name}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-text mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) =>
                                    handleInputChange(
                                        "description",
                                        e.target.value,
                                    )
                                }
                                rows="3"
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                        </div>

                        {/* Image */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-text mb-1">
                                Category Image
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                            {imagePreview && (
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="mt-2 w-32 h-32 object-cover rounded-md border border-border"
                                />
                            )}
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) =>
                                    handleInputChange(
                                        "isActive",
                                        e.target.checked,
                                    )
                                }
                                className="w-4 h-4 text-accent border-border rounded focus:ring-2 focus:ring-accent"
                            />
                            <label
                                htmlFor="isActive"
                                className="text-sm font-medium text-text"
                            >
                                Active
                            </label>
                        </div>
                    </div>

                    {/* Meta Fields - Collapsible */}
                    <details className="border border-border rounded-md p-3">
                        <summary className="cursor-pointer font-medium text-text">
                            SEO Meta Tags (Optional)
                        </summary>
                        <div className="mt-3 space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">
                                    Meta Title
                                </label>
                                <input
                                    type="text"
                                    value={formData.metaTitle}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "metaTitle",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">
                                    Meta Description
                                </label>
                                <textarea
                                    value={formData.metaDescription}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "metaDescription",
                                            e.target.value,
                                        )
                                    }
                                    rows="2"
                                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">
                                    Meta Keywords (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    value={formData.metaKeywords}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "metaKeywords",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                                    placeholder="silver, bracelet, jewelry"
                                />
                            </div>
                        </div>
                    </details>

                    {/* Submit Buttons */}
                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={cancelForm}
                            className="px-4 py-2 border border-border rounded-md text-text hover:bg-background transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <MdSave size={20} />
                            {submitting
                                ? "Saving..."
                                : editingCategory
                                  ? "Update"
                                  : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    // Render category row
    const renderCategory = (category, level = 0) => {
        const isExpanded = expandedCategories[category._id];
        const isEditing = editingCategory === category._id;

        return (
            <div key={category._id} className="mb-2">
                {/* Category Row */}
                <div
                    className="border border-border rounded-lg overflow-hidden bg-background"
                    style={{ marginLeft: `${level * 24}px` }}
                >
                    <button
                        onClick={() => toggleCategory(category._id)}
                        className="w-full hover:bg-border/20 transition-colors"
                    >
                        <div className="grid grid-cols-12 gap-3 px-4 py-3 items-center">
                            {/* Level Indicator & Image */}
                            <div className="col-span-2 flex items-center gap-2">
                                {level > 0 && (
                                    <MdSubdirectoryArrowRight
                                        size={16}
                                        className="text-text-secondary"
                                    />
                                )}
                                {category.image?.urls?.thumbnail ? (
                                    <img
                                        src={category.image.urls.thumbnail}
                                        alt={
                                            category.image.alt || category.name
                                        }
                                        className="w-12 h-12 rounded object-cover border border-border"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                                        <MdImage
                                            size={20}
                                            className="text-text-secondary"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Name & Slug */}
                            <div className="col-span-4 text-left">
                                <div className="font-semibold text-sm text-text">
                                    {category.name}
                                </div>
                                <div className="text-xs text-text-secondary">
                                    /{category.slug}
                                </div>
                            </div>

                            {/* Description Preview */}
                            <div className="col-span-3 text-left">
                                <p className="text-sm text-text-secondary line-clamp-1">
                                    {category.description || "—"}
                                </p>
                            </div>

                            {/* Children Count */}
                            <div className="col-span-1 text-center">
                                {category.children &&
                                    category.children.length > 0 && (
                                        <span className="text-xs text-text-secondary">
                                            {category.children.length} sub
                                        </span>
                                    )}
                            </div>

                            {/* Status & Expand */}
                            <div className="col-span-2 flex items-center justify-end gap-3">
                                {category.isActive ? (
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
                                {isExpanded ? (
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
                    {isExpanded && (
                        <div className="border-t border-border bg-surface/50 p-6">
                            {isEditing ? (
                                renderForm()
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                                        {/* Basic Info */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-text mb-2">
                                                Basic Information
                                            </h4>
                                            <div className="space-y-2 text-sm">
                                                <div>
                                                    <span className="text-text-secondary">
                                                        Level:
                                                    </span>{" "}
                                                    <span className="text-text">
                                                        {category.level}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-text-secondary">
                                                        Sort Order:
                                                    </span>{" "}
                                                    <span className="text-text">
                                                        {category.sortOrder}
                                                    </span>
                                                </div>
                                                {category.parent && (
                                                    <div>
                                                        <span className="text-text-secondary">
                                                            Parent:
                                                        </span>{" "}
                                                        <span className="text-text">
                                                            {category.parent
                                                                .name ||
                                                                category.parent}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* SEO */}
                                        {(category.metaTitle ||
                                            category.metaKeywords?.length >
                                                0) && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-text mb-2">
                                                    SEO Meta
                                                </h4>
                                                <div className="space-y-2 text-sm">
                                                    {category.metaTitle && (
                                                        <div>
                                                            <span className="text-text-secondary">
                                                                Title:
                                                            </span>{" "}
                                                            <span className="text-text">
                                                                {
                                                                    category.metaTitle
                                                                }
                                                            </span>
                                                        </div>
                                                    )}
                                                    {category.metaKeywords &&
                                                        category.metaKeywords
                                                            .length > 0 && (
                                                            <div>
                                                                <span className="text-text-secondary">
                                                                    Keywords:
                                                                </span>{" "}
                                                                <span className="text-text">
                                                                    {category.metaKeywords.join(
                                                                        ", ",
                                                                    )}
                                                                </span>
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Timestamps */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-text mb-2">
                                                History
                                            </h4>
                                            <div className="space-y-2 text-sm">
                                                <div>
                                                    <span className="text-text-secondary">
                                                        Created:
                                                    </span>{" "}
                                                    <span className="text-text text-xs">
                                                        {new Date(
                                                            category.createdAt,
                                                        ).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {category.updatedAt !==
                                                    category.createdAt && (
                                                    <div>
                                                        <span className="text-text-secondary">
                                                            Updated:
                                                        </span>{" "}
                                                        <span className="text-text text-xs">
                                                            {new Date(
                                                                category.updatedAt,
                                                            ).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-4 border-t border-border">
                                        <button
                                            onClick={() =>
                                                startEditCategory(category)
                                            }
                                            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors flex items-center gap-2"
                                        >
                                            <MdEdit size={18} />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDelete(
                                                    category._id,
                                                    category.name,
                                                )
                                            }
                                            className="px-4 py-2 bg-danger text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                                        >
                                            <MdDelete size={18} />
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Render Children */}
                {category.children && category.children.length > 0 && (
                    <div className="mt-2">
                        {category.children.map((child) =>
                            renderCategory(child, level + 1),
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-100">
                <Loader />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text">Categories</h1>
                    <p className="text-text-secondary mt-1">
                        Manage product categories and subcategories
                    </p>
                </div>
                {!showAddForm && !editingCategory && (
                    <button
                        onClick={startAddCategory}
                        className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-dark transition-colors flex items-center gap-2"
                    >
                        <MdAdd size={20} />
                        Add Category
                    </button>
                )}
            </div>

            {/* Add/Edit Form */}
            {showAddForm && renderForm()}

            {/* Categories List */}
            <div className="bg-surface rounded-lg shadow-md p-6">
                {categories.length > 0 ? (
                    <div className="space-y-2">
                        {categories.map((category) =>
                            renderCategory(category, 0),
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <MdImage
                            size={64}
                            className="mx-auto text-text-secondary mb-4"
                        />
                        <p className="text-text-secondary">No categories yet</p>
                        <button
                            onClick={startAddCategory}
                            className="mt-4 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-dark transition-colors"
                        >
                            Create First Category
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Categories;
