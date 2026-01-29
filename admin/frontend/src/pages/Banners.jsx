import React, { useState, useEffect } from "react";
import {
    MdAdd,
    MdEdit,
    MdDelete,
    MdImage,
    MdDragIndicator,
    MdClose,
    MdCheck,
    MdLink,
} from "react-icons/md";
import {
    getAllBanners,
    createBanner,
    updateBanner,
    softDeleteBanner,
    hardDeleteBanner,
    updateBannerStatus,
    reorderBanners,
} from "../api/banners.api";
import logger from "../utils/logger.util.js";

const Banners = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [filterLocation, setFilterLocation] = useState("");
    const [filterActive, setFilterActive] = useState("");

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        subtitle: "",
        linkType: "internal",
        linkUrl: "",
        buttonText: "",
        displayLocation: "home",
        sortOrder: 0,
        isActive: true,
        startDate: "",
        endDate: "",
    });
    const [desktopImage, setDesktopImage] = useState(null);
    const [mobileImage, setMobileImage] = useState(null);
    const [desktopImagePreview, setDesktopImagePreview] = useState(null);
    const [mobileImagePreview, setMobileImagePreview] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    // Fetch banners
    const fetchBanners = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filterActive !== "") params.isActive = filterActive;
            if (filterLocation) params.displayLocation = filterLocation;

            const response = await getAllBanners(params);
            setBanners(response.data.banners || []);
        } catch (err) {
            logger.error("Error fetching banners:", err);
            setMessage({
                type: "error",
                text: err.response?.data?.message || "Failed to fetch banners",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, [filterActive, filterLocation]);

    // Reset form
    const resetForm = () => {
        setFormData({
            title: "",
            subtitle: "",
            linkType: "internal",
            linkUrl: "",
            buttonText: "",
            displayLocation: "home",
            sortOrder: 0,
            isActive: true,
            startDate: "",
            endDate: "",
        });
        setDesktopImage(null);
        setMobileImage(null);
        setDesktopImagePreview(null);
        setMobileImagePreview(null);
        setFormErrors({});
        setEditingBanner(null);
        setShowForm(false);
    };

    // Handle input change
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        // Clear error for this field
        if (formErrors[name]) {
            setFormErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    // Handle desktop image change
    const handleDesktopImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                setFormErrors((prev) => ({
                    ...prev,
                    desktopImage: "Please select a valid image file",
                }));
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setFormErrors((prev) => ({
                    ...prev,
                    desktopImage: "Image size should be less than 5MB",
                }));
                return;
            }
            setDesktopImage(file);
            setDesktopImagePreview(URL.createObjectURL(file));
            setFormErrors((prev) => ({ ...prev, desktopImage: null }));
        }
    };

    // Handle mobile image change
    const handleMobileImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                setFormErrors((prev) => ({
                    ...prev,
                    mobileImage: "Please select a valid image file",
                }));
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setFormErrors((prev) => ({
                    ...prev,
                    mobileImage: "Image size should be less than 5MB",
                }));
                return;
            }
            setMobileImage(file);
            setMobileImagePreview(URL.createObjectURL(file));
            setFormErrors((prev) => ({ ...prev, mobileImage: null }));
        }
    };

    // Validate form
    const validateForm = () => {
        const errors = {};

        if (!formData.title.trim()) {
            errors.title = "Title is required";
        } else if (formData.title.length > 100) {
            errors.title = "Title cannot exceed 100 characters";
        }

        if (formData.subtitle && formData.subtitle.length > 200) {
            errors.subtitle = "Subtitle cannot exceed 200 characters";
        }

        if (formData.buttonText && formData.buttonText.length > 50) {
            errors.buttonText = "Button text cannot exceed 50 characters";
        }

        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            if (start >= end) {
                errors.dateRange = "End date must be after start date";
            }
        }

        if (!editingBanner && !desktopImage) {
            errors.desktopImage = "Desktop image is required";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            setMessage({
                type: "error",
                text: "Please fix the errors in the form",
            });
            return;
        }

        setLoading(true);
        try {
            const formDataToSend = new FormData();

            // Add text fields
            formDataToSend.append("title", formData.title);
            if (formData.subtitle)
                formDataToSend.append("subtitle", formData.subtitle);
            if (formData.buttonText)
                formDataToSend.append("buttonText", formData.buttonText);
            formDataToSend.append("displayLocation", formData.displayLocation);
            formDataToSend.append("sortOrder", formData.sortOrder);
            formDataToSend.append("isActive", formData.isActive);

            // Add link object as JSON string
            const link = {
                type: formData.linkType,
                url: formData.linkUrl || "",
            };
            formDataToSend.append("link", JSON.stringify(link));

            // Add dates
            if (formData.startDate)
                formDataToSend.append("startDate", formData.startDate);
            if (formData.endDate)
                formDataToSend.append("endDate", formData.endDate);

            // Add images
            if (desktopImage) formDataToSend.append("images", desktopImage);
            if (mobileImage) formDataToSend.append("images", mobileImage);

            let response;
            if (editingBanner) {
                response = await updateBanner(
                    editingBanner._id,
                    formDataToSend,
                );
                setMessage({
                    type: "success",
                    text:
                        response.data?.message || "Banner updated successfully",
                });
            } else {
                response = await createBanner(formDataToSend);
                setMessage({
                    type: "success",
                    text:
                        response.data?.message || "Banner created successfully",
                });
            }

            resetForm();
            fetchBanners();
        } catch (err) {
            logger.error("Error saving banner:", err);
            const errorMessage =
                err.response?.data?.message || "Failed to save banner";
            const validationErrors = err.response?.data?.data;

            if (validationErrors && typeof validationErrors === "object") {
                setFormErrors(validationErrors);
            }

            setMessage({ type: "error", text: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    // Handle edit
    const handleEdit = (banner) => {
        setEditingBanner(banner);
        setFormData({
            title: banner.title || "",
            subtitle: banner.subtitle || "",
            linkType: banner.link?.type || "internal",
            linkUrl: banner.link?.url || "",
            buttonText: banner.buttonText || "",
            displayLocation: banner.displayLocation || "home",
            sortOrder: banner.sortOrder || 0,
            isActive: banner.isActive !== undefined ? banner.isActive : true,
            startDate: banner.startDate ? banner.startDate.split("T")[0] : "",
            endDate: banner.endDate ? banner.endDate.split("T")[0] : "",
        });
        setDesktopImagePreview(banner.desktopImage?.url || null);
        setMobileImagePreview(banner.mobileImage?.url || null);
        setShowForm(true);
    };

    // Handle delete
    const handleDelete = async (bannerId, hard = false) => {
        const confirmMessage = hard
            ? "Are you sure you want to permanently delete this banner? This action cannot be undone."
            : "Are you sure you want to deactivate this banner?";

        if (!window.confirm(confirmMessage)) return;

        setLoading(true);
        try {
            const response = hard
                ? await hardDeleteBanner(bannerId)
                : await softDeleteBanner(bannerId);

            setMessage({
                type: "success",
                text: response.data?.message || "Banner deleted successfully",
            });
            fetchBanners();
        } catch (err) {
            logger.error("Error deleting banner:", err);
            setMessage({
                type: "error",
                text: err.response?.data?.message || "Failed to delete banner",
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle status toggle
    const handleStatusToggle = async (bannerId, currentStatus) => {
        setLoading(true);
        try {
            const response = await updateBannerStatus(bannerId, !currentStatus);
            setMessage({
                type: "success",
                text:
                    response.data?.message ||
                    "Banner status updated successfully",
            });
            fetchBanners();
        } catch (err) {
            logger.error("Error updating banner status:", err);
            setMessage({
                type: "error",
                text:
                    err.response?.data?.message ||
                    "Failed to update banner status",
            });
        } finally {
            setLoading(false);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // Check if banner is scheduled
    const isScheduled = (banner) => {
        if (!banner.startDate && !banner.endDate) return true;

        const now = new Date();
        const start = banner.startDate ? new Date(banner.startDate) : null;
        const end = banner.endDate ? new Date(banner.endDate) : null;

        const isAfterStart = !start || now >= start;
        const isBeforeEnd = !end || now <= end;

        return isAfterStart && isBeforeEnd;
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-3xl font-bold text-text">Banners</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                    {showForm ? (
                        <>
                            <MdClose size={20} />
                            Cancel
                        </>
                    ) : (
                        <>
                            <MdAdd size={20} />
                            Add Banner
                        </>
                    )}
                </button>
            </div>

            {/* Message Banner */}
            {message && (
                <div
                    className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
                        message.type === "success"
                            ? "bg-success/20 text-success border border-success/30"
                            : "bg-danger/20 text-danger border border-danger/30"
                    }`}
                >
                    <span>{message.text}</span>
                    <button
                        onClick={() => setMessage(null)}
                        className="p-1 hover:bg-black/10 rounded transition-colors"
                    >
                        <MdClose size={20} />
                    </button>
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div className="bg-surface rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-bold text-text mb-4">
                        {editingBanner ? "Edit Banner" : "Add New Banner"}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Title <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface text-text"
                                placeholder="Enter banner title"
                            />
                            {formErrors.title && (
                                <p className="mt-1 text-sm text-danger">
                                    {formErrors.title}
                                </p>
                            )}
                        </div>

                        {/* Subtitle */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Subtitle
                            </label>
                            <input
                                type="text"
                                name="subtitle"
                                value={formData.subtitle}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface text-text"
                                placeholder="Enter banner subtitle"
                            />
                            {formErrors.subtitle && (
                                <p className="mt-1 text-sm text-danger">
                                    {formErrors.subtitle}
                                </p>
                            )}
                        </div>

                        {/* Link Type and URL */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">
                                    Link Type
                                </label>
                                <select
                                    name="linkType"
                                    value={formData.linkType}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface text-text"
                                >
                                    <option value="internal">Internal</option>
                                    <option value="external">External</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">
                                    Link URL
                                </label>
                                <input
                                    type="text"
                                    name="linkUrl"
                                    value={formData.linkUrl}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface text-text"
                                    placeholder={
                                        formData.linkType === "internal"
                                            ? "/products"
                                            : "https://example.com"
                                    }
                                />
                            </div>
                        </div>

                        {/* Button Text */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Button Text
                            </label>
                            <input
                                type="text"
                                name="buttonText"
                                value={formData.buttonText}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface text-text"
                                placeholder="e.g., Shop Now"
                            />
                            {formErrors.buttonText && (
                                <p className="mt-1 text-sm text-danger">
                                    {formErrors.buttonText}
                                </p>
                            )}
                        </div>

                        {/* Display Location and Sort Order */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">
                                    Display Location
                                </label>
                                <select
                                    name="displayLocation"
                                    value={formData.displayLocation}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface text-text"
                                >
                                    <option value="home">Home</option>
                                    <option value="shop">Shop</option>
                                    <option value="about">About</option>
                                    <option value="contact">Contact</option>
                                    {/* <option value="all">All Pages</option> */}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">
                                    Sort Order
                                </label>
                                <input
                                    type="number"
                                    name="sortOrder"
                                    value={formData.sortOrder}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface text-text"
                                    min="0"
                                />
                            </div>
                        </div>

                        {/* Start and End Date */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface text-text"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface text-text"
                                />
                            </div>
                        </div>
                        {formErrors.dateRange && (
                            <p className="text-sm text-danger">
                                {formErrors.dateRange}
                            </p>
                        )}

                        {/* Active Status */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleInputChange}
                                className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                            />
                            <label className="text-sm font-medium text-text">
                                Active (Banner will be visible)
                            </label>
                        </div>

                        {/* Desktop Image */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Desktop Image{" "}
                                <span className="text-danger">*</span>
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleDesktopImageChange}
                                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface text-text"
                            />
                            {formErrors.desktopImage && (
                                <p className="mt-1 text-sm text-danger">
                                    {formErrors.desktopImage}
                                </p>
                            )}
                            {desktopImagePreview && (
                                <div className="mt-2">
                                    <img
                                        src={desktopImagePreview}
                                        alt="Desktop preview"
                                        className="h-48 object-cover rounded-lg border border-border"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Mobile Image */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Mobile Image (Optional)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleMobileImageChange}
                                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface text-text"
                            />
                            {formErrors.mobileImage && (
                                <p className="mt-1 text-sm text-danger">
                                    {formErrors.mobileImage}
                                </p>
                            )}
                            {mobileImagePreview && (
                                <div className="mt-2">
                                    <img
                                        src={mobileImagePreview}
                                        alt="Mobile preview"
                                        className="h-48 object-cover rounded-lg border border-border"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {loading
                                    ? "Saving..."
                                    : editingBanner
                                      ? "Update Banner"
                                      : "Create Banner"}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-6 py-2 bg-surface border border-border text-text rounded-lg hover:bg-background transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="bg-surface rounded-lg shadow-md p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text mb-1">
                            Display Location
                        </label>
                        <select
                            value={filterLocation}
                            onChange={(e) => setFilterLocation(e.target.value)}
                            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface text-text"
                        >
                            <option value="">All Locations</option>
                            <option value="home">Home</option>
                            <option value="shop">Shop</option>
                            <option value="about">About</option>
                            <option value="contact">Contact</option>
                            {/* <option value="all">All Pages</option> */}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text mb-1">
                            Status
                        </label>
                        <select
                            value={filterActive}
                            onChange={(e) => setFilterActive(e.target.value)}
                            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface text-text"
                        >
                            <option value="">All Status</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Banners List */}
            <div className="bg-surface rounded-lg shadow-md overflow-hidden">
                {loading && !showForm ? (
                    <div className="p-8 text-center text-text-secondary">
                        Loading banners...
                    </div>
                ) : banners.length === 0 ? (
                    <div className="p-8 text-center text-text-secondary">
                        No banners found. Create your first banner!
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-background">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                        Order
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                        Images
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                        Title
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                        Location
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                        Schedule
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-surface divide-y divide-border">
                                {banners.map((banner) => (
                                    <tr
                                        key={banner._id}
                                        className="hover:bg-background transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-text">
                                                <MdDragIndicator className="text-text-secondary" />
                                                <span className="font-medium">
                                                    {banner.sortOrder}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {banner.desktopImage && (
                                                    <img
                                                        src={
                                                            banner.desktopImage
                                                                .url
                                                        }
                                                        alt={banner.title}
                                                        className="h-12 object-cover rounded border border-border"
                                                    />
                                                )}
                                                {banner.mobileImage && (
                                                    <img
                                                        src={
                                                            banner.mobileImage
                                                                .url
                                                        }
                                                        alt={`${banner.title} mobile`}
                                                        className="h-12 object-cover rounded border border-border"
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-medium text-text">
                                                    {banner.title}
                                                </p>
                                                {banner.subtitle && (
                                                    <p className="text-xs text-text-secondary mt-1">
                                                        {banner.subtitle}
                                                    </p>
                                                )}
                                                {banner.link?.url && (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <MdLink
                                                            size={12}
                                                            className="text-text-secondary"
                                                        />
                                                        <span className="text-xs text-text-secondary truncate max-w-xs">
                                                            {banner.link.url}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-info/20 text-info">
                                                {banner.displayLocation}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                                            <div>
                                                {banner.startDate && (
                                                    <p className="text-xs">
                                                        From:{" "}
                                                        {formatDate(
                                                            banner.startDate,
                                                        )}
                                                    </p>
                                                )}
                                                {banner.endDate && (
                                                    <p className="text-xs">
                                                        To:{" "}
                                                        {formatDate(
                                                            banner.endDate,
                                                        )}
                                                    </p>
                                                )}
                                                {!banner.startDate &&
                                                    !banner.endDate && (
                                                        <span className="text-xs text-text-secondary">
                                                            Always Active
                                                        </span>
                                                    )}
                                                <div className="mt-1">
                                                    {isScheduled(banner) ? (
                                                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-success/20 text-success">
                                                            Scheduled
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-warning/20 text-warning">
                                                            Not Scheduled
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() =>
                                                    handleStatusToggle(
                                                        banner._id,
                                                        banner.isActive,
                                                    )
                                                }
                                                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                                    banner.isActive
                                                        ? "bg-success/20 text-success hover:bg-success/30"
                                                        : "bg-danger/20 text-danger hover:bg-danger/30"
                                                }`}
                                            >
                                                {banner.isActive
                                                    ? "Active"
                                                    : "Inactive"}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() =>
                                                        handleEdit(banner)
                                                    }
                                                    className="p-2 text-info hover:bg-info/10 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <MdEdit size={18} />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(
                                                            banner._id,
                                                            false,
                                                        )
                                                    }
                                                    className="p-2 text-warning hover:bg-warning/10 rounded transition-colors"
                                                    title="Deactivate"
                                                >
                                                    <MdClose size={18} />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(
                                                            banner._id,
                                                            true,
                                                        )
                                                    }
                                                    className="p-2 text-danger hover:bg-danger/10 rounded transition-colors"
                                                    title="Delete Permanently"
                                                >
                                                    <MdDelete size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Banners;
