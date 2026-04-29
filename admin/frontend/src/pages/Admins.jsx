import React, { useState, useEffect } from "react";
import {
    MdAdd,
    MdPerson,
    MdEmail,
    MdPhone,
    MdAdminPanelSettings,
    MdClose,
    MdCheck,
    MdBlock,
    MdRefresh,
    MdEdit,
} from "react-icons/md";
import {
    listAdmins,
    createAdmin,
    toggleAdminStatus,
    updateAdmin,
} from "../api/admins.api";
import { handleApiError } from "../utils/axios";
import logger from "../utils/logger.util";
import Loader from "../components/common/Loader";
import { useAuth } from "../context/AuthContext";

const ROLES = ["staff", "manager", "admin", "super-admin"];

const ROLE_BADGE_CLASSES = {
    "super-admin": "bg-danger/10 text-danger",
    admin: "bg-primary/10 text-primary",
    manager: "bg-warning/10 text-warning",
    staff: "bg-success/10 text-success",
};

const formatDate = (d) =>
    d
        ? new Date(d).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
          })
        : "—";

const emptyForm = {
    name: "",
    email: "",
    password: "",
    role: "staff",
    phone: "",
};

const Admins = () => {
    const { user } = useAuth();

    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [formErrors, setFormErrors] = useState({});

    const [confirmToggle, setConfirmToggle] = useState(null); // admin object to toggle

    const showMessage = (text, type = "success") => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    };

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await listAdmins();
            if (response.success) {
                setAdmins(response.data || []);
                logger.info("Admins fetched", { count: response.data?.length });
            }
        } catch (err) {
            const msg = handleApiError(err);
            setError(msg);
            logger.error("Failed to fetch admins:", msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const validateForm = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = "Name is required";
        if (!formData.email.trim()) errors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email))
            errors.email = "Invalid email";
        if (!editingAdmin) {
            if (!formData.password) errors.password = "Password is required";
            else if (formData.password.length < 8)
                errors.password = "Password must be at least 8 characters";
        }
        if (!formData.role) errors.role = "Role is required";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setActionLoading(true);

            if (editingAdmin) {
                const payload = {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    phone: formData.phone || undefined,
                };
                const response = await updateAdmin(editingAdmin._id, payload);
                if (response.success) {
                    showMessage("Admin updated successfully");
                    setAdmins((prev) =>
                        prev.map((a) =>
                            a._id === editingAdmin._id ? response.data : a,
                        ),
                    );
                    closeForm();
                    logger.info("Admin updated:", formData.email);
                }
            } else {
                const payload = { ...formData };
                if (!payload.phone) delete payload.phone;
                const response = await createAdmin(payload);
                if (response.success) {
                    showMessage("Admin created successfully");
                    closeForm();
                    fetchAdmins();
                    logger.info("Admin created:", formData.email);
                }
            }
        } catch (err) {
            const msg = handleApiError(err);
            showMessage(msg, "error");
            logger.error("Failed to save admin:", msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!confirmToggle) return;
        try {
            setActionLoading(true);
            const response = await toggleAdminStatus(confirmToggle._id);
            if (response.success) {
                showMessage(
                    `${confirmToggle.name} has been ${confirmToggle.isActive ? "deactivated" : "activated"}`,
                );
                setAdmins((prev) =>
                    prev.map((a) =>
                        a._id === confirmToggle._id
                            ? { ...a, isActive: !a.isActive }
                            : a,
                    ),
                );
                logger.info("Admin status toggled:", confirmToggle.email);
            }
        } catch (err) {
            const msg = handleApiError(err);
            showMessage(msg, "error");
            logger.error("Failed to toggle admin status:", msg);
        } finally {
            setActionLoading(false);
            setConfirmToggle(null);
        }
    };

    const openForm = () => {
        setEditingAdmin(null);
        setFormData(emptyForm);
        setFormErrors({});
        setShowForm(true);
    };

    const openEdit = (admin) => {
        setEditingAdmin(admin);
        setFormData({
            name: admin.name,
            email: admin.email,
            role: admin.role,
            phone: admin.phone || "",
            password: "",
        });
        setFormErrors({});
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingAdmin(null);
        setFormData(emptyForm);
        setFormErrors({});
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader size="lg" text="Loading admins..." />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text">
                        Admin Users
                    </h1>
                    <p className="text-sm text-text-secondary mt-1">
                        Manage admin accounts and their roles
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchAdmins}
                        className="p-2 rounded-lg border border-border text-text-secondary hover:text-text hover:bg-surface transition-colors"
                        title="Refresh"
                    >
                        <MdRefresh className="w-5 h-5" />
                    </button>
                    <button
                        onClick={openForm}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
                    >
                        <MdAdd className="w-5 h-5" />
                        New Admin
                    </button>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div
                    className={`px-4 py-3 rounded-lg text-sm font-medium ${
                        message.type === "error"
                            ? "bg-danger/10 text-danger border border-danger/20"
                            : "bg-success/10 text-success border border-success/20"
                    }`}
                >
                    {message.text}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="px-4 py-3 rounded-lg text-sm bg-danger/10 text-danger border border-danger/20">
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-background">
                                <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                    Admin
                                </th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">
                                    Phone
                                </th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden lg:table-cell">
                                    Last Login
                                </th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden lg:table-cell">
                                    Created
                                </th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="text-right px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {admins.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="text-center py-12 text-text-secondary"
                                    >
                                        No admins found
                                    </td>
                                </tr>
                            ) : (
                                admins.map((admin) => (
                                    <tr
                                        key={admin._id}
                                        className="hover:bg-background/50 transition-colors"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                    {admin.avatar ? (
                                                        <img
                                                            src={admin.avatar}
                                                            alt={admin.name}
                                                            className="w-9 h-9 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <MdPerson className="w-5 h-5 text-primary" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-text leading-tight">
                                                        {admin.name}
                                                        {admin._id ===
                                                            user?._id && (
                                                            <span className="ml-2 text-xs text-text-secondary">
                                                                (you)
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-text-secondary">
                                                        {admin.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                                                    ROLE_BADGE_CLASSES[
                                                        admin.role
                                                    ] ||
                                                    "bg-border text-text-secondary"
                                                }`}
                                            >
                                                <MdAdminPanelSettings className="w-3.5 h-3.5" />
                                                {admin.role}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-text-secondary hidden md:table-cell">
                                            {admin.phone || "—"}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-text-secondary hidden lg:table-cell">
                                            {formatDate(admin.lastLogin)}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-text-secondary hidden lg:table-cell">
                                            {formatDate(admin.createdAt)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                                    admin.isActive
                                                        ? "bg-success/10 text-success"
                                                        : "bg-danger/10 text-danger"
                                                }`}
                                            >
                                                {admin.isActive ? (
                                                    <MdCheck className="w-3.5 h-3.5" />
                                                ) : (
                                                    <MdBlock className="w-3.5 h-3.5" />
                                                )}
                                                {admin.isActive
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() =>
                                                        openEdit(admin)
                                                    }
                                                    className="text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text hover:bg-background transition-colors font-medium flex items-center gap-1"
                                                    title="Edit admin"
                                                >
                                                    <MdEdit className="w-3.5 h-3.5" />
                                                    Edit
                                                </button>
                                                {admin._id !== user?._id && (
                                                    <button
                                                        onClick={() =>
                                                            setConfirmToggle(
                                                                admin,
                                                            )
                                                        }
                                                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium ${
                                                            admin.isActive
                                                                ? "border-danger/30 text-danger hover:bg-danger/10"
                                                                : "border-success/30 text-success hover:bg-success/10"
                                                        }`}
                                                    >
                                                        {admin.isActive
                                                            ? "Deactivate"
                                                            : "Activate"}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Admin Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-xl border border-border w-full max-w-lg shadow-xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <h2 className="text-lg font-semibold text-text">
                                {editingAdmin
                                    ? "Edit Admin"
                                    : "Create New Admin"}
                            </h2>
                            <button
                                onClick={closeForm}
                                className="p-1.5 rounded-lg hover:bg-background text-text-secondary transition-colors"
                            >
                                <MdClose className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form
                            onSubmit={handleSubmit}
                            className="px-6 py-5 space-y-4"
                        >
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-text mb-1.5">
                                    Full Name{" "}
                                    <span className="text-danger">*</span>
                                </label>
                                <div className="relative">
                                    <MdPerson className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData((p) => ({
                                                ...p,
                                                name: e.target.value,
                                            }))
                                        }
                                        placeholder="John Doe"
                                        className={`w-full pl-9 pr-4 py-2.5 bg-background border rounded-lg text-sm text-text placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                                            formErrors.name
                                                ? "border-danger"
                                                : "border-border"
                                        }`}
                                    />
                                </div>
                                {formErrors.name && (
                                    <p className="text-xs text-danger mt-1">
                                        {formErrors.name}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-text mb-1.5">
                                    Email <span className="text-danger">*</span>
                                </label>
                                <div className="relative">
                                    <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData((p) => ({
                                                ...p,
                                                email: e.target.value,
                                            }))
                                        }
                                        placeholder="admin@example.com"
                                        className={`w-full pl-9 pr-4 py-2.5 bg-background border rounded-lg text-sm text-text placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                                            formErrors.email
                                                ? "border-danger"
                                                : "border-border"
                                        }`}
                                    />
                                </div>
                                {formErrors.email && (
                                    <p className="text-xs text-danger mt-1">
                                        {formErrors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password — only shown when creating */}
                            {!editingAdmin && (
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1.5">
                                        Password{" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) =>
                                            setFormData((p) => ({
                                                ...p,
                                                password: e.target.value,
                                            }))
                                        }
                                        placeholder="Min 8 characters"
                                        className={`w-full px-4 py-2.5 bg-background border rounded-lg text-sm text-text placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                                            formErrors.password
                                                ? "border-danger"
                                                : "border-border"
                                        }`}
                                    />
                                    {formErrors.password && (
                                        <p className="text-xs text-danger mt-1">
                                            {formErrors.password}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-medium text-text mb-1.5">
                                    Role <span className="text-danger">*</span>
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) =>
                                        setFormData((p) => ({
                                            ...p,
                                            role: e.target.value,
                                        }))
                                    }
                                    disabled={editingAdmin?._id === user?._id}
                                    className={`w-full px-4 py-2.5 bg-background border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed ${
                                        formErrors.role
                                            ? "border-danger"
                                            : "border-border"
                                    }`}
                                >
                                    {ROLES.map((r) => (
                                        <option key={r} value={r}>
                                            {r.charAt(0).toUpperCase() +
                                                r.slice(1)}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-text-secondary mt-1">
                                    {editingAdmin?._id === user?._id
                                        ? "You cannot change your own role"
                                        : "Permissions are assigned automatically based on role"}
                                </p>
                                {formErrors.role && (
                                    <p className="text-xs text-danger mt-1">
                                        {formErrors.role}
                                    </p>
                                )}
                            </div>

                            {/* Phone (optional) */}
                            <div>
                                <label className="block text-sm font-medium text-text mb-1.5">
                                    Phone{" "}
                                    <span className="text-text-secondary text-xs font-normal">
                                        (optional)
                                    </span>
                                </label>
                                <div className="relative">
                                    <MdPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) =>
                                            setFormData((p) => ({
                                                ...p,
                                                phone: e.target.value,
                                            }))
                                        }
                                        placeholder="+91 98765 43210"
                                        className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-text placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                            </div>

                            {/* Role permission info */}
                            <div className="bg-background border border-border rounded-lg p-3 text-xs text-text-secondary space-y-1">
                                <p className="font-medium text-text">
                                    Role permissions:
                                </p>
                                <p>
                                    <span className="text-danger font-medium">
                                        Super Admin
                                    </span>{" "}
                                    — Full access to everything
                                </p>
                                <p>
                                    <span className="text-primary font-medium">
                                        Admin
                                    </span>{" "}
                                    — Products, orders, coupons, banners, users,
                                    reviews, bulk ops
                                </p>
                                <p>
                                    <span className="text-warning font-medium">
                                        Manager
                                    </span>{" "}
                                    — Products (view/edit), orders (view/edit),
                                    banners, reviews
                                </p>
                                <p>
                                    <span className="text-success font-medium">
                                        Staff
                                    </span>{" "}
                                    — Products, orders, reviews (view only)
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    disabled={actionLoading}
                                    className="px-4 py-2.5 border border-border text-text-secondary hover:text-text hover:bg-background rounded-lg text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium disabled:opacity-60"
                                >
                                    {actionLoading ? (
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <MdCheck className="w-4 h-4" />
                                    )}
                                    {editingAdmin
                                        ? "Save Changes"
                                        : "Create Admin"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Toggle Status Modal */}
            {confirmToggle && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-xl border border-border w-full max-w-sm shadow-xl p-6">
                        <h3 className="text-base font-semibold text-text mb-2">
                            {confirmToggle.isActive ? "Deactivate" : "Activate"}{" "}
                            Admin
                        </h3>
                        <p className="text-sm text-text-secondary mb-6">
                            Are you sure you want to{" "}
                            {confirmToggle.isActive ? "deactivate" : "activate"}{" "}
                            <span className="font-medium text-text">
                                {confirmToggle.name}
                            </span>
                            ?
                            {confirmToggle.isActive &&
                                " They will no longer be able to log in."}
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setConfirmToggle(null)}
                                disabled={actionLoading}
                                className="px-4 py-2 border border-border text-text-secondary hover:text-text hover:bg-background rounded-lg text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleToggleStatus}
                                disabled={actionLoading}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60 ${
                                    confirmToggle.isActive
                                        ? "bg-danger hover:bg-danger/80"
                                        : "bg-success hover:bg-success/80"
                                }`}
                            >
                                {actionLoading && (
                                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                )}
                                {confirmToggle.isActive
                                    ? "Deactivate"
                                    : "Activate"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admins;
