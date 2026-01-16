/**
 * Home Page (Dashboard)
 * Main landing page after login
 */

import React from "react";
import { useAuth } from "../context/AuthContext";

const Home = () => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-text mb-2">
                    Welcome back, {user?.name || "Admin"}!
                </h1>
                <p className="text-text-secondary mb-8">
                    Manage your jewelry inventory with ease
                </p>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-surface rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-text-secondary text-sm">
                                    Total Products
                                </p>
                                <p className="text-3xl font-bold text-text mt-1">
                                    0
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-primary"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-text-secondary text-sm">
                                    Total Variants
                                </p>
                                <p className="text-3xl font-bold text-text mt-1">
                                    0
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-accent"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-text-secondary text-sm">
                                    Categories
                                </p>
                                <p className="text-3xl font-bold text-text mt-1">
                                    0
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-success"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-text-secondary text-sm">
                                    Low Stock
                                </p>
                                <p className="text-3xl font-bold text-text mt-1">
                                    0
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-warning"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-surface rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-text mb-4">
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button className="p-4 border-2 border-border rounded-lg hover:border-accent hover:bg-accent/5 transition-all text-left">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <svg
                                        className="w-5 h-5 text-primary"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 4v16m8-8H4"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-text">
                                        Add Product
                                    </p>
                                    <p className="text-sm text-text-secondary">
                                        Create new product
                                    </p>
                                </div>
                            </div>
                        </button>

                        <button className="p-4 border-2 border-border rounded-lg hover:border-accent hover:bg-accent/5 transition-all text-left">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                                    <svg
                                        className="w-5 h-5 text-success"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-text">
                                        Import Products
                                    </p>
                                    <p className="text-sm text-text-secondary">
                                        Bulk upload via Excel
                                    </p>
                                </div>
                            </div>
                        </button>

                        <button className="p-4 border-2 border-border rounded-lg hover:border-accent hover:bg-accent/5 transition-all text-left">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center">
                                    <svg
                                        className="w-5 h-5 text-info"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-text">
                                        Export Products
                                    </p>
                                    <p className="text-sm text-text-secondary">
                                        Download as Excel
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
