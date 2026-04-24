import { useState, useEffect, useCallback } from "react";
import {
    MdAdd,
    MdEdit,
    MdDelete,
    MdClose,
    MdCheck,
    MdSave,
    MdRefresh,
    MdLocalOffer,
    MdToggleOn,
    MdToggleOff,
    MdExpandMore,
    MdExpandLess,
    MdContentCopy,
    MdBarChart,
} from "react-icons/md";
import {
    getAllCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCouponStatus,
    getCouponStats,
    getCouponUsageHistory,
} from "../api/coupons.api";
import { getAllCategories } from "../api/categories.api";
import { getAllProducts } from "../api/products.api";
import { handleApiError } from "../utils/axios";
import logger from "../utils/logger.util";
import Loader from "../components/common/Loader";

// ============================================================================
// HELPERS
// ============================================================================

const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatDateForInput = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    // Format to YYYY-MM-DD for date input
    return d.toISOString().split("T")[0];
};

const getCouponStatusBadge = (coupon) => {
    const now = new Date();
    if (!coupon.isActive)
        return { label: "Inactive", color: "bg-gray-100 text-gray-600" };
    if (new Date(coupon.validTo) < now)
        return { label: "Expired", color: "bg-red-100 text-red-700" };
    if (new Date(coupon.validFrom) > now)
        return { label: "Upcoming", color: "bg-yellow-100 text-yellow-700" };
    return { label: "Active", color: "bg-green-100 text-green-700" };
};

const getDiscountLabel = (coupon) => {
    if (coupon.discountType === "percentage") return `${coupon.discountValue}%`;
    if (coupon.discountType === "flat") return `₹${coupon.discountValue}`;
    if (coupon.discountType === "free_shipping") return "Free Ship";
    return coupon.discountValue;
};

const getDiscountBadgeColor = (type) => {
    if (type === "percentage") return "bg-blue-100 text-blue-700";
    if (type === "flat") return "bg-purple-100 text-purple-700";
    return "bg-teal-100 text-teal-700";
};

const EMPTY_FORM = {
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    maxDiscount: "",
    minOrderValue: "",
    usageLimit: "",
    perUserLimit: "1",
    validFrom: "",
    validTo: "",
    isActive: true,
    applicableCategories: [],
    applicableProducts: [],
    excludedProducts: [],
    applicableCollections: "",
    applicableUsers: "",
    firstTimeUserOnly: false,
    tags: "",
    internalNotes: "",
};

// ============================================================================
// MULTI-SELECT CHECKBOX COMPONENT
// ============================================================================

const MultiSelectList = ({
    label,
    items,
    selected,
    onChange,
    idKey = "_id",
    nameKey = "name",
}) => {
    const [search, setSearch] = useState("");

    const filtered = items.filter((item) =>
        (item[nameKey] || "").toLowerCase().includes(search.toLowerCase()),
    );

    const toggle = (id) => {
        if (selected.includes(id)) {
            onChange(selected.filter((s) => s !== id));
        } else {
            onChange([...selected, id]);
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-text mb-1">
                {label}{" "}
                {selected.length > 0 && (
                    <span className="text-accent font-semibold">
                        ({selected.length} selected)
                    </span>
                )}
            </label>
            <div className="border border-border rounded-md overflow-hidden">
                <div className="p-2 border-b border-border bg-background">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                </div>
                <div className="max-h-36 overflow-y-auto">
                    {filtered.length === 0 ? (
                        <p className="text-xs text-text-secondary p-3 text-center">
                            No items found
                        </p>
                    ) : (
                        filtered.map((item) => (
                            <label
                                key={item[idKey]}
                                className="flex items-center gap-2 px-3 py-1.5 hover:bg-background cursor-pointer text-sm"
                            >
                                <input
                                    type="checkbox"
                                    checked={selected.includes(item[idKey])}
                                    onChange={() => toggle(item[idKey])}
                                    className="accent-accent"
                                />
                                <span className="text-text">
                                    {item[nameKey]}
                                </span>
                            </label>
                        ))
                    )}
                </div>
            </div>
            {selected.length > 0 && (
                <button
                    type="button"
                    onClick={() => onChange([])}
                    className="mt-1 text-xs text-danger hover:underline"
                >
                    Clear selection
                </button>
            )}
        </div>
    );
};

// ============================================================================
// STATS PANEL COMPONENT
// ============================================================================

const CouponStatsPanel = ({ couponId, onClose }) => {
    const [statsData, setStatsData] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const [statsRes, histRes] = await Promise.all([
                    getCouponStats(couponId),
                    getCouponUsageHistory(couponId),
                ]);
                // statsRes.data = { coupon: {...}, stats: { totalOrders, totalRevenue, totalDiscount } }
                setStatsData(statsRes.data);
                // histRes.data = array of Order documents
                setHistory(histRes.data || []);
            } catch (err) {
                logger.error("Failed to load coupon stats:", err);
                setError("Failed to load analytics");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [couponId]);

    const couponInfo = statsData?.coupon;
    const orderStats = statsData?.stats;
    const avgDiscount =
        orderStats?.totalOrders > 0
            ? Math.round(orderStats.totalDiscount / orderStats.totalOrders)
            : null;

    const statCards = statsData
        ? [
              {
                  label: "Total Uses",
                  value: couponInfo?.usageCount ?? orderStats?.totalOrders ?? 0,
              },
              {
                  label: "Unique Users",
                  value: couponInfo?.uniqueUsers ?? 0,
              },
              {
                  label: "Total Discount",
                  value: `₹${(orderStats?.totalDiscount ?? 0).toLocaleString("en-IN")}`,
              },
              {
                  label: "Avg Discount",
                  value: avgDiscount
                      ? `₹${avgDiscount.toLocaleString("en-IN")}`
                      : "—",
              },
          ]
        : [];

    return (
        <div className="bg-surface border border-border rounded-lg p-4 mt-2">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-text flex items-center gap-2">
                    <MdBarChart className="text-accent" />
                    Usage Statistics
                </h4>
                <button
                    onClick={onClose}
                    className="text-text-secondary hover:text-text"
                >
                    <MdClose size={18} />
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-4">
                    <Loader size="sm" />
                </div>
            ) : error ? (
                <p className="text-sm text-danger text-center py-3">{error}</p>
            ) : statsData ? (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        {statCards.map((s) => (
                            <div
                                key={s.label}
                                className="bg-background rounded-md p-3 text-center"
                            >
                                <p className="text-xs text-text-secondary mb-1">
                                    {s.label}
                                </p>
                                <p className="font-bold text-text text-lg">
                                    {s.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    {history.length > 0 ? (
                        <>
                            <h5 className="text-sm font-medium text-text mb-2">
                                Recent Orders
                            </h5>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-background text-text-secondary">
                                            <th className="text-left py-1.5 px-2">
                                                Customer
                                            </th>
                                            <th className="text-left py-1.5 px-2">
                                                Order
                                            </th>
                                            <th className="text-right py-1.5 px-2">
                                                Discount
                                            </th>
                                            <th className="text-right py-1.5 px-2">
                                                Date
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history
                                            .slice(0, 10)
                                            .map((order, i) => (
                                                <tr
                                                    key={order._id || i}
                                                    className="border-t border-border"
                                                >
                                                    <td className="py-1.5 px-2">
                                                        {order.customer
                                                            ? `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim() ||
                                                              order.customer
                                                                  .phone ||
                                                              order.customer
                                                                  .email ||
                                                              "—"
                                                            : "—"}
                                                    </td>
                                                    <td className="py-1.5 px-2 font-mono">
                                                        {order.orderNumber ||
                                                            "—"}
                                                    </td>
                                                    <td className="py-1.5 px-2 text-right">
                                                        ₹
                                                        {order.appliedCoupon
                                                            ?.discountAmount ??
                                                            0}
                                                    </td>
                                                    <td className="py-1.5 px-2 text-right text-text-secondary">
                                                        {formatDate(
                                                            order.createdAt,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <p className="text-xs text-text-secondary text-center py-2">
                            No orders have used this coupon yet
                        </p>
                    )}
                </>
            ) : (
                <p className="text-sm text-text-secondary text-center py-3">
                    No usage data yet
                </p>
            )}
        </div>
    );
};

// ============================================================================
// MAIN PAGE
// ============================================================================

const Coupons = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});

    // Reference data for selectors
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [refLoading, setRefLoading] = useState(false);

    // Expanded stats rows
    const [expandedStats, setExpandedStats] = useState(null);

    // -------------------------------------------------------------------------
    // DATA LOADING
    // -------------------------------------------------------------------------

    const fetchCoupons = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getAllCoupons({ limit: 100 });
            // getAllCoupons returns response.data (API body): { success, data: [...], meta }
            setCoupons(response.data || []);
        } catch (err) {
            handleApiError(err);
            logger.error("Failed to fetch coupons:", err);
            showMessage("error", "Failed to load coupons");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchReferenceData = useCallback(async () => {
        try {
            setRefLoading(true);
            const [catRes, prodRes] = await Promise.all([
                getAllCategories(),
                getAllProducts({ limit: 200, isActive: true }),
            ]);
            setCategories(catRes.data || catRes.categories || catRes || []);
            const prodList = prodRes.data || [];
            setProducts(prodList);
        } catch (err) {
            logger.error("Failed to load reference data:", err);
        } finally {
            setRefLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    // -------------------------------------------------------------------------
    // MESSAGES
    // -------------------------------------------------------------------------

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    // -------------------------------------------------------------------------
    // FORM HANDLERS
    // -------------------------------------------------------------------------

    const openCreate = () => {
        setFormData(EMPTY_FORM);
        setFormErrors({});
        setEditingId(null);
        setShowForm(true);
        if (categories.length === 0 && products.length === 0) {
            fetchReferenceData();
        }
    };

    const openEdit = (coupon) => {
        setFormData({
            code: coupon.code || "",
            description: coupon.description || "",
            discountType: coupon.discountType || "percentage",
            discountValue: coupon.discountValue ?? "",
            maxDiscount: coupon.maxDiscount ?? "",
            minOrderValue: coupon.minOrderValue ?? "",
            usageLimit: coupon.usageLimit ?? "",
            perUserLimit: coupon.perUserLimit ?? "1",
            validFrom: formatDateForInput(coupon.validFrom),
            validTo: formatDateForInput(coupon.validTo),
            isActive: coupon.isActive ?? true,
            applicableCategories: (coupon.applicableCategories || []).map(
                (c) => (typeof c === "object" ? c._id : c),
            ),
            applicableProducts: (coupon.applicableProducts || []).map((p) =>
                typeof p === "object" ? p._id : p,
            ),
            excludedProducts: (coupon.excludedProducts || []).map((p) =>
                typeof p === "object" ? p._id : p,
            ),
            applicableCollections: (coupon.applicableCollections || []).join(
                ", ",
            ),
            applicableUsers: (coupon.applicableUsers || [])
                .map((u) => (typeof u === "object" ? u._id : u))
                .join(", "),
            firstTimeUserOnly: coupon.firstTimeUserOnly ?? false,
            tags: (coupon.tags || []).join(", "),
            internalNotes: coupon.internalNotes || "",
        });
        setFormErrors({});
        setEditingId(coupon._id);
        setShowForm(true);
        if (categories.length === 0 && products.length === 0) {
            fetchReferenceData();
        }
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData(EMPTY_FORM);
        setFormErrors({});
    };

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors((prev) => ({ ...prev, [field]: null }));
        }
    };

    const validate = () => {
        const errors = {};
        if (!formData.code.trim()) errors.code = "Code is required";
        if (!formData.description.trim())
            errors.description = "Description is required";
        if (formData.discountValue === "" || formData.discountValue === null)
            errors.discountValue = "Discount value is required";
        if (!formData.validFrom)
            errors.validFrom = "Valid from date is required";
        if (!formData.validTo) errors.validTo = "Valid to date is required";
        if (
            formData.validFrom &&
            formData.validTo &&
            formData.validFrom >= formData.validTo
        ) {
            errors.validTo = "Valid to must be after valid from";
        }
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validate();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            setSubmitting(true);

            // Build payload
            const payload = {
                code: formData.code.trim().toUpperCase(),
                description: formData.description.trim(),
                discountType: formData.discountType,
                discountValue: Number(formData.discountValue),
                minOrderValue:
                    formData.minOrderValue !== ""
                        ? Number(formData.minOrderValue)
                        : 0,
                perUserLimit:
                    formData.perUserLimit !== ""
                        ? Number(formData.perUserLimit)
                        : 1,
                isActive: formData.isActive,
                validFrom: formData.validFrom,
                validTo: formData.validTo,
                firstTimeUserOnly: formData.firstTimeUserOnly,
                applicableCategories: formData.applicableCategories,
                applicableProducts: formData.applicableProducts,
                excludedProducts: formData.excludedProducts,
                applicableCollections: formData.applicableCollections
                    ? formData.applicableCollections
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                    : [],
                applicableUsers: formData.applicableUsers
                    ? formData.applicableUsers
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                    : [],
                tags: formData.tags
                    ? formData.tags
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                    : [],
                internalNotes: formData.internalNotes.trim() || undefined,
            };

            // Only include optional number fields if they have values
            if (formData.maxDiscount !== "" && formData.maxDiscount !== null) {
                payload.maxDiscount = Number(formData.maxDiscount);
            }
            if (formData.usageLimit !== "" && formData.usageLimit !== null) {
                payload.usageLimit = Number(formData.usageLimit);
            }

            if (editingId) {
                await updateCoupon(editingId, payload);
                showMessage("success", "Coupon updated successfully");
            } else {
                await createCoupon(payload);
                showMessage("success", "Coupon created successfully");
            }

            await fetchCoupons();
            closeForm();
        } catch (err) {
            handleApiError(err);
            const errMsg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to save coupon";
            showMessage("error", errMsg);
            logger.error("Failed to save coupon:", err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (coupon) => {
        if (
            !window.confirm(
                `Delete coupon "${coupon.code}"? This cannot be undone.`,
            )
        )
            return;
        try {
            await deleteCoupon(coupon._id);
            showMessage("success", `Coupon "${coupon.code}" deleted`);
            await fetchCoupons();
        } catch (err) {
            handleApiError(err);
            logger.error("Failed to delete coupon:", err);
            showMessage("error", "Failed to delete coupon");
        }
    };

    const handleToggleStatus = async (coupon) => {
        try {
            await toggleCouponStatus(coupon._id);
            showMessage(
                "success",
                `Coupon "${coupon.code}" ${coupon.isActive ? "deactivated" : "activated"}`,
            );
            await fetchCoupons();
        } catch (err) {
            handleApiError(err);
            logger.error("Failed to toggle coupon status:", err);
            showMessage("error", "Failed to update status");
        }
    };

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code).then(() => {
            showMessage("success", `Copied "${code}" to clipboard`);
        });
    };

    const toggleStats = (couponId) => {
        setExpandedStats((prev) => (prev === couponId ? null : couponId));
    };

    // -------------------------------------------------------------------------
    // STATS SUMMARY
    // -------------------------------------------------------------------------

    const now = new Date();
    const totalCount = coupons.length;
    const activeCount = coupons.filter(
        (c) =>
            c.isActive &&
            new Date(c.validFrom) <= now &&
            new Date(c.validTo) >= now,
    ).length;
    const expiredCount = coupons.filter(
        (c) => new Date(c.validTo) < now,
    ).length;
    const upcomingCount = coupons.filter(
        (c) => c.isActive && new Date(c.validFrom) > now,
    ).length;

    // -------------------------------------------------------------------------
    // RENDER: FORM
    // -------------------------------------------------------------------------

    const renderForm = () => (
        // Overlay
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40" onClick={closeForm} />

            {/* Slide-in panel */}
            <div className="relative w-full max-w-2xl h-full bg-surface shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                    <h2 className="text-lg font-semibold text-text flex items-center gap-2">
                        <MdLocalOffer className="text-accent" />
                        {editingId ? "Edit Coupon" : "Create Coupon"}
                    </h2>
                    <button
                        onClick={closeForm}
                        className="text-text-secondary hover:text-text transition-colors"
                    >
                        <MdClose size={22} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    <form
                        id="coupon-form"
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >
                        {/* ── SECTION 1: Basic Info ── */}
                        <section>
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3 pb-1 border-b border-border">
                                Basic Info
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Code */}
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Code{" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) =>
                                            handleChange(
                                                "code",
                                                e.target.value.toUpperCase(),
                                            )
                                        }
                                        placeholder="e.g. SAVE20"
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent font-mono tracking-widest uppercase ${formErrors.code ? "border-danger" : "border-border"}`}
                                        disabled={!!editingId}
                                    />
                                    {formErrors.code && (
                                        <p className="text-danger text-xs mt-1">
                                            {formErrors.code}
                                        </p>
                                    )}
                                    {!!editingId && (
                                        <p className="text-xs text-text-secondary mt-1">
                                            Code cannot be changed after
                                            creation
                                        </p>
                                    )}
                                </div>

                                {/* Active toggle */}
                                <div className="flex flex-col justify-center">
                                    <label className="block text-sm font-medium text-text mb-2">
                                        Status
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleChange(
                                                "isActive",
                                                !formData.isActive,
                                            )
                                        }
                                        className="flex items-center gap-2 text-sm w-fit"
                                    >
                                        {formData.isActive ? (
                                            <MdToggleOn
                                                size={32}
                                                className="text-success"
                                            />
                                        ) : (
                                            <MdToggleOff
                                                size={32}
                                                className="text-text-secondary"
                                            />
                                        )}
                                        <span
                                            className={
                                                formData.isActive
                                                    ? "text-success font-medium"
                                                    : "text-text-secondary"
                                            }
                                        >
                                            {formData.isActive
                                                ? "Active"
                                                : "Inactive"}
                                        </span>
                                    </button>
                                </div>

                                {/* Description */}
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Description{" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) =>
                                            handleChange(
                                                "description",
                                                e.target.value,
                                            )
                                        }
                                        rows={2}
                                        placeholder="Customer-facing description, e.g. Get 20% off on your first order"
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent resize-none ${formErrors.description ? "border-danger" : "border-border"}`}
                                    />
                                    {formErrors.description && (
                                        <p className="text-danger text-xs mt-1">
                                            {formErrors.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* ── SECTION 2: Discount Config ── */}
                        <section>
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3 pb-1 border-b border-border">
                                Discount Configuration
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Discount Type */}
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Discount Type{" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        value={formData.discountType}
                                        onChange={(e) =>
                                            handleChange(
                                                "discountType",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                                    >
                                        <option value="percentage">
                                            Percentage (%)
                                        </option>
                                        <option value="flat">
                                            Flat Amount (₹)
                                        </option>
                                        <option value="free_shipping">
                                            Free Shipping
                                        </option>
                                    </select>
                                </div>

                                {/* Discount Value */}
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Discount Value{" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">
                                            {formData.discountType ===
                                            "percentage"
                                                ? "%"
                                                : formData.discountType ===
                                                    "flat"
                                                  ? "₹"
                                                  : "—"}
                                        </span>
                                        <input
                                            type="number"
                                            value={formData.discountValue}
                                            onChange={(e) =>
                                                handleChange(
                                                    "discountValue",
                                                    e.target.value,
                                                )
                                            }
                                            min="0"
                                            step="0.01"
                                            placeholder="0"
                                            disabled={
                                                formData.discountType ===
                                                "free_shipping"
                                            }
                                            className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent ${formErrors.discountValue ? "border-danger" : "border-border"} disabled:bg-background disabled:text-text-secondary`}
                                        />
                                    </div>
                                    {formErrors.discountValue && (
                                        <p className="text-danger text-xs mt-1">
                                            {formErrors.discountValue}
                                        </p>
                                    )}
                                </div>

                                {/* Max Discount */}
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Max Discount Cap (₹)
                                        <span className="ml-1 text-xs text-text-secondary">
                                            optional
                                        </span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.maxDiscount}
                                        onChange={(e) =>
                                            handleChange(
                                                "maxDiscount",
                                                e.target.value,
                                            )
                                        }
                                        min="0"
                                        placeholder="No cap"
                                        disabled={
                                            formData.discountType !==
                                            "percentage"
                                        }
                                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-background disabled:text-text-secondary"
                                    />
                                    <p className="text-xs text-text-secondary mt-1">
                                        Only relevant for percentage discounts
                                    </p>
                                </div>

                                {/* Min Order Value */}
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Min Order Value (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.minOrderValue}
                                        onChange={(e) =>
                                            handleChange(
                                                "minOrderValue",
                                                e.target.value,
                                            )
                                        }
                                        min="0"
                                        placeholder="0 (no minimum)"
                                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* ── SECTION 3: Usage Limits ── */}
                        <section>
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3 pb-1 border-b border-border">
                                Usage Limits
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Total Usage Limit
                                        <span className="ml-1 text-xs text-text-secondary">
                                            optional
                                        </span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.usageLimit}
                                        onChange={(e) =>
                                            handleChange(
                                                "usageLimit",
                                                e.target.value,
                                            )
                                        }
                                        min="1"
                                        placeholder="Unlimited"
                                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                    <p className="text-xs text-text-secondary mt-1">
                                        Max total times this coupon can be used
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Per User Limit
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.perUserLimit}
                                        onChange={(e) =>
                                            handleChange(
                                                "perUserLimit",
                                                e.target.value,
                                            )
                                        }
                                        min="1"
                                        placeholder="1"
                                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                    <p className="text-xs text-text-secondary mt-1">
                                        Max times one user can use this coupon
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* ── SECTION 4: Validity Period ── */}
                        <section>
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3 pb-1 border-b border-border">
                                Validity Period
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Valid From{" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.validFrom}
                                        onChange={(e) =>
                                            handleChange(
                                                "validFrom",
                                                e.target.value,
                                            )
                                        }
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent ${formErrors.validFrom ? "border-danger" : "border-border"}`}
                                    />
                                    {formErrors.validFrom && (
                                        <p className="text-danger text-xs mt-1">
                                            {formErrors.validFrom}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Valid To{" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.validTo}
                                        onChange={(e) =>
                                            handleChange(
                                                "validTo",
                                                e.target.value,
                                            )
                                        }
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent ${formErrors.validTo ? "border-danger" : "border-border"}`}
                                    />
                                    {formErrors.validTo && (
                                        <p className="text-danger text-xs mt-1">
                                            {formErrors.validTo}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* ── SECTION 5: Applicability ── */}
                        <section>
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3 pb-1 border-b border-border">
                                Applicability
                            </h3>
                            <div className="space-y-4">
                                {/* First-time user only */}
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.firstTimeUserOnly}
                                        onChange={(e) =>
                                            handleChange(
                                                "firstTimeUserOnly",
                                                e.target.checked,
                                            )
                                        }
                                        className="w-4 h-4 accent-accent"
                                    />
                                    <span className="text-sm text-text">
                                        First-time customers only
                                    </span>
                                </label>

                                {refLoading ? (
                                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                                        <Loader size="sm" />
                                        <span>
                                            Loading categories &amp; products...
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        {/* Applicable Categories */}
                                        <MultiSelectList
                                            label="Applicable Categories"
                                            items={
                                                Array.isArray(categories)
                                                    ? categories
                                                    : []
                                            }
                                            selected={
                                                formData.applicableCategories
                                            }
                                            onChange={(val) =>
                                                handleChange(
                                                    "applicableCategories",
                                                    val,
                                                )
                                            }
                                        />

                                        {/* Applicable Products */}
                                        <MultiSelectList
                                            label="Applicable Products"
                                            items={products}
                                            selected={
                                                formData.applicableProducts
                                            }
                                            onChange={(val) =>
                                                handleChange(
                                                    "applicableProducts",
                                                    val,
                                                )
                                            }
                                        />

                                        {/* Excluded Products */}
                                        <MultiSelectList
                                            label="Excluded Products"
                                            items={products}
                                            selected={formData.excludedProducts}
                                            onChange={(val) =>
                                                handleChange(
                                                    "excludedProducts",
                                                    val,
                                                )
                                            }
                                        />
                                    </>
                                )}

                                {/* Applicable Collections */}
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Applicable Collections
                                        <span className="ml-1 text-xs text-text-secondary">
                                            comma-separated
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.applicableCollections}
                                        onChange={(e) =>
                                            handleChange(
                                                "applicableCollections",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="e.g. new-arrivals, festive, bridal"
                                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>

                                {/* Applicable Users */}
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Restrict to Specific Users
                                        <span className="ml-1 text-xs text-text-secondary">
                                            user IDs, comma-separated
                                        </span>
                                    </label>
                                    <textarea
                                        value={formData.applicableUsers}
                                        onChange={(e) =>
                                            handleChange(
                                                "applicableUsers",
                                                e.target.value,
                                            )
                                        }
                                        rows={2}
                                        placeholder="Leave blank for all users"
                                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent resize-none font-mono text-xs"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* ── SECTION 6: Metadata ── */}
                        <section>
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3 pb-1 border-b border-border">
                                Metadata
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Tags
                                        <span className="ml-1 text-xs text-text-secondary">
                                            comma-separated
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.tags}
                                        onChange={(e) =>
                                            handleChange("tags", e.target.value)
                                        }
                                        placeholder="e.g. welcome, seasonal, flash-sale"
                                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Internal Notes
                                        <span className="ml-1 text-xs text-text-secondary">
                                            optional, not visible to customers
                                        </span>
                                    </label>
                                    <textarea
                                        value={formData.internalNotes}
                                        onChange={(e) =>
                                            handleChange(
                                                "internalNotes",
                                                e.target.value,
                                            )
                                        }
                                        rows={2}
                                        placeholder="Internal notes for the team..."
                                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                                    />
                                </div>
                            </div>
                        </section>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-end gap-3 bg-surface">
                    <button
                        type="button"
                        onClick={closeForm}
                        className="px-4 py-2 text-sm border border-border rounded-md text-text hover:bg-background transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        form="coupon-form"
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 px-5 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-60"
                    >
                        {submitting ? (
                            <Loader size="sm" variant="white" />
                        ) : (
                            <MdSave size={16} />
                        )}
                        {editingId ? "Update Coupon" : "Create Coupon"}
                    </button>
                </div>
            </div>
        </div>
    );

    // -------------------------------------------------------------------------
    // RENDER: MAIN
    // -------------------------------------------------------------------------

    return (
        <div className="">
            {/* Toast message */}
            {message && (
                <div
                    className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
                        message.type === "success"
                            ? "bg-success text-white"
                            : "bg-danger text-white"
                    }`}
                >
                    {message.type === "success" ? (
                        <MdCheck size={18} />
                    ) : (
                        <MdClose size={18} />
                    )}
                    {message.text}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text flex items-center gap-2">
                        <MdLocalOffer className="text-accent" />
                        Coupons
                    </h1>
                    <p className="text-text-secondary text-sm mt-0.5">
                        Manage discount coupons and promotions
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchCoupons}
                        className="p-2 text-text-secondary hover:text-text hover:bg-background rounded-md transition-colors"
                        title="Refresh"
                    >
                        <MdRefresh size={20} />
                    </button>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors text-sm font-medium"
                    >
                        <MdAdd size={18} />
                        Create Coupon
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                    {
                        label: "Total",
                        value: totalCount,
                        color: "text-text",
                        bg: "bg-surface",
                    },
                    {
                        label: "Active",
                        value: activeCount,
                        color: "text-success",
                        bg: "bg-green-50",
                    },
                    {
                        label: "Upcoming",
                        value: upcomingCount,
                        color: "text-warning",
                        bg: "bg-yellow-50",
                    },
                    {
                        label: "Expired",
                        value: expiredCount,
                        color: "text-danger",
                        bg: "bg-red-50",
                    },
                ].map((s) => (
                    <div
                        key={s.label}
                        className={`${s.bg} border border-border rounded-lg p-4 text-center`}
                    >
                        <p className="text-xs text-text-secondary mb-1">
                            {s.label}
                        </p>
                        <p className={`text-2xl font-bold ${s.color}`}>
                            {s.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader size="lg" />
                </div>
            ) : coupons.length === 0 ? (
                <div className="bg-surface border border-border rounded-lg py-16 text-center">
                    <MdLocalOffer
                        size={48}
                        className="mx-auto text-border mb-3"
                    />
                    <p className="text-text font-medium">No coupons yet</p>
                    <p className="text-text-secondary text-sm mt-1">
                        Create your first coupon to get started
                    </p>
                    <button
                        onClick={openCreate}
                        className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors text-sm mx-auto"
                    >
                        <MdAdd size={16} />
                        Create Coupon
                    </button>
                </div>
            ) : (
                <div className="bg-surface border border-border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-background border-b border-border text-text-secondary text-xs uppercase tracking-wider">
                                    <th className="text-left py-3 px-4">
                                        Code
                                    </th>
                                    <th className="text-left py-3 px-4">
                                        Description
                                    </th>
                                    <th className="text-center py-3 px-4">
                                        Discount
                                    </th>
                                    <th className="text-right py-3 px-4">
                                        Min Order
                                    </th>
                                    <th className="text-center py-3 px-4">
                                        Validity
                                    </th>
                                    <th className="text-center py-3 px-4">
                                        Usage
                                    </th>
                                    <th className="text-center py-3 px-4">
                                        Status
                                    </th>
                                    <th className="text-right py-3 px-4">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.map((coupon) => {
                                    const badge = getCouponStatusBadge(coupon);
                                    return [
                                        <tr
                                            key={coupon._id}
                                            className="border-b border-border hover:bg-background/50 transition-colors"
                                        >
                                            {/* Code */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono font-semibold text-text tracking-wide">
                                                        {coupon.code}
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            handleCopyCode(
                                                                coupon.code,
                                                            )
                                                        }
                                                        className="text-text-secondary hover:text-accent transition-colors"
                                                        title="Copy code"
                                                    >
                                                        <MdContentCopy
                                                            size={13}
                                                        />
                                                    </button>
                                                </div>
                                                {coupon.firstTimeUserOnly && (
                                                    <span className="text-xs text-info">
                                                        First-time only
                                                    </span>
                                                )}
                                            </td>

                                            {/* Description */}
                                            <td className="py-3 px-4">
                                                <p className="text-text max-w-xs truncate">
                                                    {coupon.description}
                                                </p>
                                                {coupon.tags?.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {coupon.tags.map(
                                                            (tag) => (
                                                                <span
                                                                    key={tag}
                                                                    className="text-xs bg-background text-text-secondary px-1.5 py-0.5 rounded"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Discount */}
                                            <td className="py-3 px-4 text-center">
                                                <span
                                                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${getDiscountBadgeColor(coupon.discountType)}`}
                                                >
                                                    {getDiscountLabel(coupon)}
                                                </span>
                                                {coupon.maxDiscount && (
                                                    <p className="text-xs text-text-secondary mt-0.5">
                                                        max ₹
                                                        {coupon.maxDiscount}
                                                    </p>
                                                )}
                                            </td>

                                            {/* Min Order */}
                                            <td className="py-3 px-4 text-right text-text-secondary">
                                                {coupon.minOrderValue
                                                    ? `₹${coupon.minOrderValue.toLocaleString("en-IN")}`
                                                    : "—"}
                                            </td>

                                            {/* Validity */}
                                            <td className="py-3 px-4 text-center text-xs text-text-secondary whitespace-nowrap">
                                                <span>
                                                    {formatDate(
                                                        coupon.validFrom,
                                                    )}
                                                </span>
                                                <span className="mx-1 text-border">
                                                    →
                                                </span>
                                                <span>
                                                    {formatDate(coupon.validTo)}
                                                </span>
                                            </td>

                                            {/* Usage */}
                                            <td className="py-3 px-4 text-center">
                                                <span className="text-text font-medium">
                                                    {coupon.usageCount ?? 0}
                                                </span>
                                                {coupon.usageLimit ? (
                                                    <span className="text-text-secondary">
                                                        /{coupon.usageLimit}
                                                    </span>
                                                ) : (
                                                    <span className="text-text-secondary text-xs">
                                                        {" "}
                                                        uses
                                                    </span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="py-3 px-4 text-center">
                                                <span
                                                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}
                                                >
                                                    {badge.label}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* Toggle stats */}
                                                    <button
                                                        onClick={() =>
                                                            toggleStats(
                                                                coupon._id,
                                                            )
                                                        }
                                                        className="p-1.5 rounded hover:bg-background text-text-secondary hover:text-info transition-colors"
                                                        title="View stats"
                                                    >
                                                        {expandedStats ===
                                                        coupon._id ? (
                                                            <MdExpandLess
                                                                size={18}
                                                            />
                                                        ) : (
                                                            <MdBarChart
                                                                size={18}
                                                            />
                                                        )}
                                                    </button>

                                                    {/* Toggle active */}
                                                    <button
                                                        onClick={() =>
                                                            handleToggleStatus(
                                                                coupon,
                                                            )
                                                        }
                                                        className={`p-1.5 rounded hover:bg-background transition-colors ${coupon.isActive ? "text-success" : "text-text-secondary"}`}
                                                        title={
                                                            coupon.isActive
                                                                ? "Deactivate"
                                                                : "Activate"
                                                        }
                                                    >
                                                        {coupon.isActive ? (
                                                            <MdToggleOn
                                                                size={20}
                                                            />
                                                        ) : (
                                                            <MdToggleOff
                                                                size={20}
                                                            />
                                                        )}
                                                    </button>

                                                    {/* Edit */}
                                                    <button
                                                        onClick={() =>
                                                            openEdit(coupon)
                                                        }
                                                        className="p-1.5 rounded hover:bg-background text-text-secondary hover:text-primary transition-colors"
                                                        title="Edit"
                                                    >
                                                        <MdEdit size={17} />
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(coupon)
                                                        }
                                                        className="p-1.5 rounded hover:bg-red-50 text-text-secondary hover:text-danger transition-colors"
                                                        title="Delete"
                                                    >
                                                        <MdDelete size={17} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>,

                                        // Expanded stats row
                                        expandedStats === coupon._id && (
                                            <tr
                                                key={`${coupon._id}-stats`}
                                                className="bg-background/50"
                                            >
                                                <td
                                                    colSpan={8}
                                                    className="px-4 pb-4"
                                                >
                                                    <CouponStatsPanel
                                                        couponId={coupon._id}
                                                        onClose={() =>
                                                            setExpandedStats(
                                                                null,
                                                            )
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        ),
                                    ];
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Form slide-in panel */}
            {showForm && renderForm()}
        </div>
    );
};

export default Coupons;
