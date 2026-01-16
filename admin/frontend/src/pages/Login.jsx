import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login as loginApi } from "../api/auth.api";
import { handleApiError } from "../utils/axios";
import logger from "../utils/logger.util";

import {
    MdEmail,
    MdLock,
    MdArrowForward,
    MdShield,
    MdVisibility,
    MdVisibilityOff,
} from "react-icons/md";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { IoWarning } from "react-icons/io5";

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    // Get redirect path from location state or default to home
    const from = location.state?.from?.pathname || "/";

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Email is invalid";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await loginApi(formData.email, formData.password);

            // Backend returns admin data only (tokens set as cookies)
            const adminData = response.data.admin;

            // Update auth context (no tokens needed)
            const loginSuccess = login(adminData);

            if (loginSuccess) {
                logger.info("Login successful", { userId: adminData._id });
                navigate(from, { replace: true });
            } else {
                // Failed to store login data
                logger.error("Failed to complete login");
                setErrors({
                    general: "Failed to complete login. Please try again.",
                });
            }
        } catch (error) {
            logger.error("Login failed:", error);
            const errorMessage = handleApiError(error);
            setErrors({ general: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Login Card */}
                <div className="bg-surface rounded-xl shadow-xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
                            <MdShield className="w-8 h-8 text-accent" />
                        </div>
                        <h1 className="text-3xl font-bold text-primary mb-2">
                            Sana Silver
                        </h1>
                        <p className="text-text-secondary text-sm">
                            Admin Portal
                        </p>
                    </div>

                    {/* Error Alert */}
                    {errors.general && (
                        <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg flex items-start gap-3">
                            <IoWarning className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                            <p className="text-sm text-danger">
                                {errors.general}
                            </p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Field */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-text mb-2"
                            >
                                Email
                            </label>
                            <div className="relative">
                                <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    placeholder="admin@sansilver.com"
                                    className={`
                                        w-full pl-10 pr-4 py-2.5 
                                        bg-surface border rounded-lg
                                        text-text placeholder:text-text-secondary/50
                                        focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        transition-all
                                        ${
                                            errors.email
                                                ? "border-danger focus:ring-danger"
                                                : "border-border"
                                        }
                                    `}
                                    autoComplete="email"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1.5 text-xs text-danger flex items-center gap-1">
                                    <IoWarning className="w-3.5 h-3.5" />
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-text mb-2"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    placeholder="••••••••"
                                    className={`
                                        w-full pl-10 pr-10 py-2.5 
                                        bg-surface border rounded-lg
                                        text-text placeholder:text-text-secondary/50
                                        focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        transition-all
                                        ${
                                            errors.password
                                                ? "border-danger focus:ring-danger"
                                                : "border-border"
                                        }
                                    `}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text transition-colors"
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <MdVisibilityOff className="w-5 h-5" />
                                    ) : (
                                        <MdVisibility className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1.5 text-xs text-danger flex items-center gap-1">
                                    <IoWarning className="w-3.5 h-3.5" />
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="
                                w-full mt-6 py-3 px-4
                                bg-accent hover:bg-accent-dark
                                text-primary font-semibold rounded-lg
                                focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
                                disabled:opacity-50 disabled:cursor-not-allowed
                                transition-all duration-200
                                flex items-center justify-center gap-2
                            "
                        >
                            {isLoading ? (
                                <>
                                    <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin" />
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <MdArrowForward className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 pt-6 border-t border-border">
                        <p className="text-center text-sm text-text-secondary">
                            Need help?{" "}
                            <button
                                type="button"
                                onClick={() => navigate("/forgot-password")}
                                className="text-accent hover:text-accent-dark font-medium transition-colors"
                            >
                                Reset Password
                            </button>
                        </p>
                    </div>
                </div>

                {/* Security Badge */}
                <p className="mt-4 text-center text-xs text-text-secondary flex items-center justify-center gap-1.5">
                    <MdShield className="w-4 h-4" />
                    <span>Secured with 256-bit encryption</span>
                </p>
            </div>
        </div>
    );
};

export default Login;
