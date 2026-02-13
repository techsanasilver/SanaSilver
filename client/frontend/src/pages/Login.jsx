/**
 * Login Page
 * Phone + OTP authentication (handles both login and registration)
 */

import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logger from "../utils/logger.util";

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [step, setStep] = useState(1); // 1 = phone, 2 = OTP, 3 = new user details
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [isNewUser, setIsNewUser] = useState(false);
    const [userData, setUserData] = useState({ name: "", email: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const from = location.state?.from?.pathname || "/";

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError("");

        if (phone.length !== 10) {
            setError("Please enter a valid 10-digit phone number");
            return;
        }

        setLoading(true);

        try {
            // Call sendOTP API
            logger.info("Sending OTP", { phone });
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            setStep(2);
            logger.info("OTP sent successfully");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send OTP");
            logger.error("Send OTP failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError("");

        if (otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP");
            return;
        }

        setLoading(true);

        try {
            // Check if it's a new user (you'd get this from backend)
            const mockIsNewUser = Math.random() > 0.5;

            if (mockIsNewUser) {
                setIsNewUser(true);
                setStep(3);
                logger.info("New user detected, requesting additional details");
            } else {
                // Existing user - login directly
                await login(phone, otp);
                logger.info("Login successful");
                navigate(from, { replace: true });
            }
        } catch (err) {
            setError(err.response?.data?.message || "Invalid OTP");
            logger.error("Verify OTP failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");

        if (!userData.name.trim()) {
            setError("Please enter your name");
            return;
        }

        setLoading(true);

        try {
            // Register with additional details
            await login(phone, otp, userData);
            logger.info("Registration successful");
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed");
            logger.error("Registration failed:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white p-8 rounded-lg shadow-md">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <Link
                            to="/"
                            className="text-3xl font-bold text-primary"
                        >
                            Sana Silver
                        </Link>
                        <p className="text-neutral-600 mt-2">
                            {step === 1 &&
                                "Welcome! Login or create an account"}
                            {step === 2 && "Enter the OTP sent to your phone"}
                            {step === 3 && "Complete your profile"}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Phone Number */}
                    {step === 1 && (
                        <form onSubmit={handleSendOTP}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Phone Number
                                </label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 border border-r-0 border-neutral-300 rounded-l-lg bg-neutral-50 text-neutral-600">
                                        +91
                                    </span>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) =>
                                            setPhone(
                                                e.target.value
                                                    .replace(/\D/g, "")
                                                    .slice(0, 10),
                                            )
                                        }
                                        placeholder="Enter 10-digit mobile number"
                                        className="flex-1 px-4 py-2 border border-neutral-300 rounded-r-lg focus:outline-none focus:border-primary"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || phone.length !== 10}
                                className="w-full px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark disabled:bg-neutral-300 disabled:cursor-not-allowed"
                            >
                                {loading ? "Sending..." : "Send OTP"}
                            </button>
                        </form>
                    )}

                    {/* Step 2: OTP Verification */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyOTP}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Enter OTP
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) =>
                                        setOtp(
                                            e.target.value
                                                .replace(/\D/g, "")
                                                .slice(0, 6),
                                        )
                                    }
                                    placeholder="Enter 6-digit OTP"
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary text-center text-2xl tracking-widest"
                                    required
                                />
                                <p className="text-sm text-neutral-600 mt-2">
                                    OTP sent to +91 {phone}
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark disabled:bg-neutral-300 disabled:cursor-not-allowed mb-3"
                            >
                                {loading ? "Verifying..." : "Verify OTP"}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full text-sm text-primary hover:underline"
                            >
                                Change phone number
                            </button>
                        </form>
                    )}

                    {/* Step 3: New User Details */}
                    {step === 3 && (
                        <form onSubmit={handleRegister}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    value={userData.name}
                                    onChange={(e) =>
                                        setUserData({
                                            ...userData,
                                            name: e.target.value,
                                        })
                                    }
                                    placeholder="Enter your full name"
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary"
                                    required
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Email (Optional)
                                </label>
                                <input
                                    type="email"
                                    value={userData.email}
                                    onChange={(e) =>
                                        setUserData({
                                            ...userData,
                                            email: e.target.value,
                                        })
                                    }
                                    placeholder="Enter your email"
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !userData.name.trim()}
                                className="w-full px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark disabled:bg-neutral-300 disabled:cursor-not-allowed"
                            >
                                {loading
                                    ? "Creating Account..."
                                    : "Complete Registration"}
                            </button>
                        </form>
                    )}

                    {/* Footer */}
                    <p className="text-center text-sm text-neutral-600 mt-6">
                        By continuing, you agree to our{" "}
                        <Link
                            to="/terms"
                            className="text-primary hover:underline"
                        >
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link
                            to="/privacy"
                            className="text-primary hover:underline"
                        >
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
