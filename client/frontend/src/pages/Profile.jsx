import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/common/Loader";
import { FiHeart, FiChevronRight, FiLogOut } from "react-icons/fi";
import { updateProfile } from "../api/auth.api";
import { getOrders } from "../api/orders.api";
import logger from "../utils/logger.util";

const inputCls =
    "w-full px-4 py-2.5 text-base border border-neutral-200 rounded-sm bg-white focus:outline-none focus:border-text-primary transition-colors";

const EMPTY_ADDRESS = {
    type: "home",
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    isDefault: false,
};

const validatePersonalInfo = (form) => {
    if (
        form.email.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    )
        return "Enter a valid email address.";
    if (form.firstName.trim().length > 50)
        return "First name cannot exceed 50 characters.";
    if (form.lastName.trim().length > 50)
        return "Last name cannot exceed 50 characters.";
    return null;
};

const validateAddress = (data) => {
    if (!data.name.trim()) return "Full name is required.";
    if (data.name.trim().length > 100)
        return "Name cannot exceed 100 characters.";
    if (!data.phone.trim()) return "Phone number is required.";
    if (!/^[6-9]\d{9}$|^\+91[6-9]\d{9}$/.test(data.phone.trim()))
        return "Enter a valid 10-digit Indian mobile number.";
    if (!data.addressLine1.trim()) return "Address line 1 is required.";
    if (!data.city.trim()) return "City is required.";
    if (!data.state.trim()) return "State is required.";
    if (!data.pincode.trim()) return "Pincode is required.";
    if (!/^\d{6}$/.test(data.pincode.trim()))
        return "Pincode must be exactly 6 digits.";
    return null;
};

const ORDER_STATUS_STYLES = {
    pending: "bg-neutral-100 text-text-secondary",
    confirmed: "bg-blue-50 text-blue-600",
    shipped: "bg-amber-50 text-amber-600",
    delivered: "bg-green-50 text-green-600",
    cancelled: "bg-red-50 text-red-600",
};

const makeChangeHandler = (setter) => (e) => {
    const { name, type, checked, value } = e.target;
    setter((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
    }));
};

const AddressForm = ({
    data,
    onChange,
    onSubmit,
    onCancel,
    saving,
    error,
    submitLabel,
}) => (
    <form
        onSubmit={onSubmit}
        noValidate
        className="space-y-3 p-4 bg-neutral-50 border border-neutral-200 rounded-sm"
    >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
                name="name"
                value={data.name}
                onChange={onChange}
                placeholder="Full name *"
                maxLength={100}
                className={inputCls}
            />
            <input
                name="phone"
                value={data.phone}
                onChange={onChange}
                placeholder="Phone number * (10 digits)"
                inputMode="tel"
                maxLength={13}
                className={inputCls}
            />
            <input
                name="addressLine1"
                value={data.addressLine1}
                onChange={onChange}
                placeholder="Address line 1 *"
                required
                className={`${inputCls} sm:col-span-2`}
            />
            <input
                name="addressLine2"
                value={data.addressLine2}
                onChange={onChange}
                placeholder="Address line 2"
                className={`${inputCls} sm:col-span-2`}
            />
            <input
                name="city"
                value={data.city}
                onChange={onChange}
                placeholder="City *"
                required
                className={inputCls}
            />
            <input
                name="state"
                value={data.state}
                onChange={onChange}
                placeholder="State *"
                required
                className={inputCls}
            />
            <input
                name="pincode"
                value={data.pincode}
                onChange={onChange}
                placeholder="Pincode * (6 digits)"
                inputMode="numeric"
                maxLength={6}
                className={inputCls}
            />
            <input
                name="landmark"
                value={data.landmark}
                onChange={onChange}
                placeholder="Landmark"
                className={inputCls}
            />
            <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
                <select
                    name="type"
                    value={data.type}
                    onChange={onChange}
                    className="px-3 py-2 text-sm border border-neutral-200 rounded-sm bg-white focus:outline-none focus:border-text-primary"
                >
                    <option value="home">Home</option>
                    <option value="office">Office</option>
                    <option value="other">Other</option>
                </select>
                <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
                    <input
                        type="checkbox"
                        name="isDefault"
                        checked={data.isDefault}
                        onChange={onChange}
                        className="w-4 h-4"
                    />
                    Set as default address
                </label>
            </div>
        </div>

        {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-sm px-3 py-2">
                {error}
            </p>
        )}

        <div className="flex gap-2 pt-1">
            <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 w-auto text-sm bg-text-primary text-white rounded-sm hover:bg-text-secondary disabled:opacity-50 flex items-center gap-2"
            >
                {saving ? (
                    <>
                        <Loader size="sm" variant="white" /> Saving
                    </>
                ) : (
                    submitLabel
                )}
            </button>
            <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm border border-neutral-200 text-text-secondary rounded-sm hover:border-text-primary hover:text-text-primary transition-colors"
            >
                Cancel
            </button>
        </div>
    </form>
);

const Profile = () => {
    const { user, isLoading: authLoading, updateUser, logout } = useAuth();
    const navigate = useNavigate();

    // ── Personal info ──
    const [editingInfo, setEditingInfo] = useState(false);
    const [infoForm, setInfoForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
    });
    const [savingInfo, setSavingInfo] = useState(false);
    const [infoError, setInfoError] = useState(null);
    const [infoSuccess, setInfoSuccess] = useState(false);

    // ── Address: add ──
    const [showAddForm, setShowAddForm] = useState(false);
    const [addFormData, setAddFormData] = useState(EMPTY_ADDRESS);
    const [addingAddress, setAddingAddress] = useState(false);
    const [addError, setAddError] = useState(null);

    // ── Address: edit ──
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [editFormData, setEditFormData] = useState(EMPTY_ADDRESS);
    const [savingAddress, setSavingAddress] = useState(false);
    const [editError, setEditError] = useState(null);

    // ── Address: delete / set default ──
    const [deletingAddressId, setDeletingAddressId] = useState(null);
    const [settingDefaultId, setSettingDefaultId] = useState(null);

    // ── Orders ──
    const [recentOrders, setRecentOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);

    // ── Logout ──
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        getOrders({ limit: 3 })
            .then((res) => setRecentOrders(res.data?.data || []))
            .catch(() => {})
            .finally(() => setOrdersLoading(false));
    }, []);

    if (authLoading) return <Loader fullScreen />;

    const addresses = user?.addresses || [];

    // ── Personal info handlers ──

    const handleEditInfo = () => {
        setInfoForm({
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
            email: user?.email || "",
        });
        setInfoError(null);
        setInfoSuccess(false);
        setEditingInfo(true);
    };

    const handleSaveInfo = async () => {
        const validationError = validatePersonalInfo(infoForm);
        if (validationError) {
            setInfoError(validationError);
            return;
        }
        setSavingInfo(true);
        setInfoError(null);
        try {
            const response = await updateProfile({
                firstName: infoForm.firstName.trim(),
                lastName: infoForm.lastName.trim(),
                email: infoForm.email.trim(),
            });
            updateUser(response.data?.data?.user);
            setEditingInfo(false);
            setInfoSuccess(true);
            setTimeout(() => setInfoSuccess(false), 3000);
            logger.info("Personal info updated");
        } catch (err) {
            setInfoError(
                err.response?.data?.message || "Failed to save changes.",
            );
        } finally {
            setSavingInfo(false);
        }
    };

    // ── Address handlers ──

    const handleAddAddress = async (e) => {
        e.preventDefault();
        const validationError = validateAddress(addFormData);
        if (validationError) {
            setAddError(validationError);
            return;
        }
        setAddingAddress(true);
        setAddError(null);
        try {
            const newAddresses = addFormData.isDefault
                ? [
                      ...addresses.map((a) => ({ ...a, isDefault: false })),
                      addFormData,
                  ]
                : [...addresses, addFormData];
            const response = await updateProfile({ addresses: newAddresses });
            updateUser(response.data?.data?.user);
            setShowAddForm(false);
            setAddFormData(EMPTY_ADDRESS);
            logger.info("Address added");
        } catch (err) {
            setAddError(
                err.response?.data?.message || "Failed to add address.",
            );
        } finally {
            setAddingAddress(false);
        }
    };

    const handleStartEdit = (address) => {
        setEditingAddressId(address._id);
        setEditFormData({
            type: address.type || "home",
            name: address.name,
            phone: address.phone,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2 || "",
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            landmark: address.landmark || "",
            isDefault: address.isDefault || false,
        });
        setEditError(null);
        setShowAddForm(false);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        const validationError = validateAddress(editFormData);
        if (validationError) {
            setEditError(validationError);
            return;
        }
        setSavingAddress(true);
        setEditError(null);
        try {
            const updatedAddresses = addresses.map((a) => {
                if (a._id === editingAddressId)
                    return { ...a, ...editFormData };
                return editFormData.isDefault ? { ...a, isDefault: false } : a;
            });
            const response = await updateProfile({
                addresses: updatedAddresses,
            });
            updateUser(response.data?.data?.user);
            setEditingAddressId(null);
            logger.info("Address updated");
        } catch (err) {
            setEditError(
                err.response?.data?.message || "Failed to update address.",
            );
        } finally {
            setSavingAddress(false);
        }
    };

    const handleDelete = async (addressId) => {
        setDeletingAddressId(addressId);
        try {
            const deletedAddress = addresses.find((a) => a._id === addressId);
            let remaining = addresses.filter((a) => a._id !== addressId);
            if (deletedAddress?.isDefault && remaining.length > 0) {
                remaining = remaining.map((a, i) => ({
                    ...a,
                    isDefault: i === 0,
                }));
            }
            const response = await updateProfile({ addresses: remaining });
            updateUser(response.data?.data?.user);
            logger.info("Address deleted");
        } catch (err) {
            logger.error("Failed to delete address:", err.message);
        } finally {
            setDeletingAddressId(null);
        }
    };

    const handleSetDefault = async (addressId) => {
        setSettingDefaultId(addressId);
        try {
            const updatedAddresses = addresses.map((a) => ({
                ...a,
                isDefault: a._id === addressId,
            }));
            const response = await updateProfile({
                addresses: updatedAddresses,
            });
            updateUser(response.data?.data?.user);
            logger.info("Default address set");
        } catch (err) {
            logger.error("Failed to set default address:", err.message);
        } finally {
            setSettingDefaultId(null);
        }
    };

    const handleLogout = async () => {
        setLoggingOut(true);
        await logout();
        navigate("/login");
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-background-primary">
            <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-display text-text-primary mb-8">
                    My Profile
                </h1>

                <div className="space-y-8">
                    {/* ── Personal Information ── */}
                    <section className="bg-white border border-neutral-200 rounded-sm">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                            <h2 className="text-xl font-medium text-text-primary">
                                Personal Information
                            </h2>
                            {!editingInfo && (
                                <button
                                    onClick={handleEditInfo}
                                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                                >
                                    Edit
                                </button>
                            )}
                        </div>

                        <div className="px-6 py-5">
                            {editingInfo ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-text-secondary mb-1.5">
                                                First Name
                                            </label>
                                            <input
                                                value={infoForm.firstName}
                                                onChange={(e) =>
                                                    setInfoForm((p) => ({
                                                        ...p,
                                                        firstName:
                                                            e.target.value,
                                                    }))
                                                }
                                                placeholder="First name"
                                                className={inputCls}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-text-secondary mb-1.5">
                                                Last Name
                                            </label>
                                            <input
                                                value={infoForm.lastName}
                                                onChange={(e) =>
                                                    setInfoForm((p) => ({
                                                        ...p,
                                                        lastName:
                                                            e.target.value,
                                                    }))
                                                }
                                                placeholder="Last name"
                                                className={inputCls}
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm text-text-secondary mb-1.5">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={infoForm.email}
                                                onChange={(e) =>
                                                    setInfoForm((p) => ({
                                                        ...p,
                                                        email: e.target.value,
                                                    }))
                                                }
                                                placeholder="Email address"
                                                className={inputCls}
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm text-text-secondary mb-1.5">
                                                Phone
                                            </label>
                                            <input
                                                value={user?.phone || ""}
                                                disabled
                                                className={`${inputCls} bg-neutral-50 cursor-not-allowed text-text-secondary`}
                                            />
                                            <p className="text-sm text-text-secondary mt-1">
                                                Phone number cannot be changed
                                            </p>
                                        </div>
                                    </div>

                                    {infoError && (
                                        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-sm px-3 py-2">
                                            {infoError}
                                        </p>
                                    )}

                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSaveInfo}
                                            disabled={savingInfo}
                                            className="px-4 py-2 text-sm bg-text-primary text-white rounded-sm hover:bg-text-secondary disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {savingInfo && (
                                                <Loader
                                                    size="sm"
                                                    variant="white"
                                                />
                                            )}
                                            Save changes
                                        </button>
                                        <button
                                            onClick={() =>
                                                setEditingInfo(false)
                                            }
                                            className="px-4 py-2 text-sm border border-neutral-200 text-text-secondary rounded-sm hover:border-text-primary hover:text-text-primary transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
                                    <div>
                                        <p className="text-sm text-text-secondary mb-1">
                                            First Name
                                        </p>
                                        <p className="text-base text-text-primary">
                                            {user?.firstName || (
                                                <span className="italic text-text-secondary">
                                                    Not set
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-secondary mb-1">
                                            Last Name
                                        </p>
                                        <p className="text-base text-text-primary">
                                            {user?.lastName || (
                                                <span className="italic text-text-secondary">
                                                    Not set
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-secondary mb-1">
                                            Email
                                        </p>
                                        <p className="text-base text-text-primary">
                                            {user?.email || (
                                                <span className="italic text-text-secondary">
                                                    Not set
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-secondary mb-1">
                                            Phone
                                        </p>
                                        <p className="text-base text-text-primary">
                                            {user?.phone}
                                        </p>
                                    </div>
                                    {infoSuccess && (
                                        <p className="sm:col-span-2 text-sm text-green-600">
                                            Changes saved successfully.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ── Saved Addresses ── */}
                    <section className="bg-white border border-neutral-200 rounded-sm">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                            <h2 className="text-xl font-medium text-text-primary">
                                Saved Addresses
                            </h2>
                            {!showAddForm && (
                                <button
                                    onClick={() => {
                                        setShowAddForm(true);
                                        setAddFormData(EMPTY_ADDRESS);
                                        setAddError(null);
                                        setEditingAddressId(null);
                                    }}
                                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                                >
                                    + Add new
                                </button>
                            )}
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            {/* Add form */}
                            {showAddForm && (
                                <AddressForm
                                    data={addFormData}
                                    onChange={makeChangeHandler(setAddFormData)}
                                    onSubmit={handleAddAddress}
                                    onCancel={() => {
                                        setShowAddForm(false);
                                        setAddError(null);
                                    }}
                                    saving={addingAddress}
                                    error={addError}
                                    submitLabel="Add address"
                                />
                            )}

                            {addresses.length === 0 && !showAddForm && (
                                <p className="text-base text-text-secondary text-center py-6">
                                    No saved addresses yet.
                                </p>
                            )}

                            {addresses.map((address) =>
                                editingAddressId === address._id ? (
                                    <AddressForm
                                        key={address._id}
                                        data={editFormData}
                                        onChange={makeChangeHandler(
                                            setEditFormData,
                                        )}
                                        onSubmit={handleSaveEdit}
                                        onCancel={() => {
                                            setEditingAddressId(null);
                                            setEditError(null);
                                        }}
                                        saving={savingAddress}
                                        error={editError}
                                        submitLabel="Save address"
                                    />
                                ) : (
                                    <div
                                        key={address._id}
                                        className="p-4 border border-neutral-200 rounded-sm"
                                    >
                                        {/* Address header */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-base font-medium text-text-primary">
                                                {address.name}
                                            </span>
                                            <span className="text-xs px-1.5 py-0.5 bg-neutral-100 text-text-secondary rounded-xs capitalize">
                                                {address.type}
                                            </span>
                                            {address.isDefault && (
                                                <span className="text-xs px-1.5 py-0.5 bg-success/10 text-success rounded-xs">
                                                    Default
                                                </span>
                                            )}
                                        </div>

                                        {/* Address body */}
                                        <p className="text-sm lg:text-base text-text-secondary">
                                            {address.addressLine1}
                                            {address.addressLine2 &&
                                                `, ${address.addressLine2}`}
                                        </p>
                                        <p className="text-sm lg:text-base text-text-secondary">
                                            {address.city}, {address.state} —{" "}
                                            {address.pincode}
                                        </p>
                                        {address.landmark && (
                                            <p className="text-sm lg:text-base text-text-secondary">
                                                Near {address.landmark}
                                            </p>
                                        )}
                                        <p className="text-sm lg:text-base text-text-secondary mt-0.5">
                                            {address.phone}
                                        </p>

                                        {/* Actions */}
                                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-100">
                                            <button
                                                onClick={() =>
                                                    handleStartEdit(address)
                                                }
                                                className="text-xs text-text-secondary hover:text-text-primary transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDelete(address._id)
                                                }
                                                disabled={
                                                    deletingAddressId ===
                                                    address._id
                                                }
                                                className="text-xs text-danger hover:text-danger/70 transition-colors disabled:opacity-50"
                                            >
                                                {deletingAddressId ===
                                                address._id
                                                    ? "Removing…"
                                                    : "Remove"}
                                            </button>
                                            {!address.isDefault && (
                                                <button
                                                    onClick={() =>
                                                        handleSetDefault(
                                                            address._id,
                                                        )
                                                    }
                                                    disabled={
                                                        settingDefaultId ===
                                                        address._id
                                                    }
                                                    className="text-xs text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50 ml-auto"
                                                >
                                                    {settingDefaultId ===
                                                    address._id
                                                        ? "Saving…"
                                                        : "Set as default"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    </section>

                    {/* ── Order History ── */}
                    <section className="bg-white border border-neutral-200 rounded-sm">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                            <h2 className="text-xl font-medium text-text-primary">
                                Recent Orders
                            </h2>
                            <Link
                                to="/orders"
                                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                            >
                                All orders
                            </Link>
                        </div>

                        <div className="px-6">
                            {ordersLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader size="sm" />
                                </div>
                            ) : recentOrders.length === 0 ? (
                                <p className="text-base text-text-secondary text-center py-8">
                                    No orders yet.
                                </p>
                            ) : (
                                <div className="divide-y divide-neutral-100">
                                    {recentOrders.map((order) => (
                                        <Link
                                            key={order._id}
                                            to={`/orders/${order._id}`}
                                            className="flex items-center justify-between py-4 -mx-6 px-6 hover:bg-neutral-50 transition-colors"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-text-primary">
                                                    #{order.orderNumber}
                                                </p>
                                                <p className="text-sm text-text-secondary mt-0.5">
                                                    {new Date(
                                                        order.createdAt,
                                                    ).toLocaleDateString(
                                                        "en-IN",
                                                        {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        },
                                                    )}{" "}
                                                    &middot;{" "}
                                                    {order.items.length} item
                                                    {order.items.length !== 1
                                                        ? "s"
                                                        : ""}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={`text-xs px-2 py-0.5 rounded-xs capitalize ${
                                                        ORDER_STATUS_STYLES[
                                                            order.orderStatus
                                                        ] ||
                                                        ORDER_STATUS_STYLES.pending
                                                    }`}
                                                >
                                                    {order.orderStatus}
                                                </span>
                                                <span className="text-sm font-medium text-text-primary">
                                                    ₹
                                                    {order.pricing.total.toLocaleString(
                                                        "en-IN",
                                                    )}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ── Wishlist shortcut ── */}
                    <Link
                        to="/wishlist"
                        className="bg-white border border-neutral-200 rounded-sm flex items-center justify-between px-6 py-4 hover:bg-neutral-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <FiHeart className="w-5 h-5 text-text-secondary" />
                            <span className="text-base text-text-primary">
                                My Wishlist
                            </span>
                        </div>
                        <FiChevronRight className="w-4 h-4 text-text-secondary" />
                    </Link>

                    {/* ── Sign out ── */}
                    <div className="pt-2 pb-4">
                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="w-full px-4 py-3 text-sm border border-neutral-200 text-danger hover:bg-danger/5 hover:border-danger/30 rounded-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loggingOut ? (
                                <>
                                    <Loader size="sm" /> Signing out…
                                </>
                            ) : (
                                <>
                                    <FiLogOut className="w-4 h-4" /> Sign out
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
