/**
 * Profile Page
 * User profile with personal info, addresses
 */

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/common/Loader";
import logger from "../utils/logger.util";

const Profile = () => {
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        logger.info("Profile page loaded");
        const timer = setTimeout(() => setLoading(false), 300);
        return () => clearTimeout(timer);
    }, []);

    if (loading || authLoading) {
        return <Loader />;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">My Profile</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Sidebar */}
                <div className="lg:col-span-1">
                    <div className="p-6 border border-neutral-200 rounded-lg text-center">
                        <div className="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                            {user?.name?.[0]?.toUpperCase() ||
                                user?.phone?.[0] ||
                                "U"}
                        </div>
                        <h2 className="text-xl font-semibold mb-1">
                            {user?.name || "User"}
                        </h2>
                        <p className="text-neutral-600">{user?.phone}</p>
                        <p className="text-sm text-neutral-500 mt-2">
                            {user?.email || "No email"}
                        </p>
                    </div>
                </div>

                {/* Profile Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Personal Information */}
                    <div className="p-6 border border-neutral-200 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">
                                Personal Information
                            </h2>
                            <button
                                onClick={() => setEditMode(!editMode)}
                                className="text-sm text-primary hover:underline"
                            >
                                {editMode ? "Cancel" : "Edit"}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    defaultValue={user?.name || ""}
                                    disabled={!editMode}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary disabled:bg-neutral-50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    defaultValue={user?.phone || ""}
                                    disabled
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    defaultValue={user?.email || ""}
                                    disabled={!editMode}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary disabled:bg-neutral-50"
                                />
                            </div>
                        </div>

                        {editMode && (
                            <div className="mt-4 flex gap-2">
                                <button className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark">
                                    Save Changes
                                </button>
                                <button
                                    onClick={() => setEditMode(false)}
                                    className="px-6 py-2 border border-neutral-300 font-medium rounded-lg hover:border-primary"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Saved Addresses */}
                    <div className="p-6 border border-neutral-200 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">
                                Saved Addresses
                            </h2>
                            <button className="text-sm text-primary hover:underline">
                                Add New
                            </button>
                        </div>

                        <div className="space-y-3">
                            {user?.addresses?.length > 0 ? (
                                user.addresses.map((address, index) => (
                                    <div
                                        key={index}
                                        className="p-4 border border-neutral-200 rounded-lg"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium mb-1">
                                                    {address.name}
                                                </p>
                                                <p className="text-sm text-neutral-600">
                                                    {address.address}
                                                </p>
                                                <p className="text-sm text-neutral-600">
                                                    {address.city},{" "}
                                                    {address.state} -{" "}
                                                    {address.pinCode}
                                                </p>
                                                <p className="text-sm text-neutral-600 mt-1">
                                                    {address.phone}
                                                </p>
                                            </div>
                                            <button className="text-sm text-primary hover:underline">
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-neutral-600 text-center py-4">
                                    No saved addresses yet
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
