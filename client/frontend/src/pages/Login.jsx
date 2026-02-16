import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sendOTP, verifyOTP } from "../api/auth.api";
import logger from "../utils/logger.util";
import Loader from "../components/common/Loader";
import { FaPhoneAlt } from "react-icons/fa";

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated, isLoading } = useAuth();

    const [step, setStep] = useState(1); // 1 = phone, 2 = OTP
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [devOTP, setDevOTP] = useState(""); // For displaying OTP in development

    const from = location.state?.from?.pathname || "/";

    // Redirect if already authenticated
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            logger.info("User already authenticated, redirecting to home");
            navigate(from, { replace: true });
        }
    }, [isLoading, isAuthenticated, navigate, from]);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError("");
        setDevOTP("");

        if (phone.length !== 10) {
            setError("Please enter a valid 10-digit phone number");
            return;
        }

        setLoading(true);

        try {
            const response = await sendOTP(`+91${phone}`);

            // Show OTP in development
            if (response.data?.data?.otp) {
                setDevOTP(response.data.data.otp);
            }

            setStep(2);
            logger.info("OTP sent successfully");
        } catch (err) {
            const errorMsg =
                err.response?.data?.message ||
                "Failed to send OTP. Please try again.";
            setError(errorMsg);
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
            const response = await verifyOTP(`+91${phone}`, otp);
            const { user } = response.data?.data || {};

            // Login successful (works for both new and existing users)
            login(user);
            logger.info("Login successful");
            navigate(from, { replace: true });
        } catch (err) {
            const errorMsg =
                err.response?.data?.message || "Invalid OTP. Please try again.";
            setError(errorMsg);
            logger.error("Verify OTP failed:", err);
        } finally {
            setLoading(false);
        }
    };

    // Show loading state while checking authentication
    if (isLoading) {
        return <Loader />;
    }

    return (
        <div className="min-h-[90vh] flex items-center justify-center bg-background-primary px-4 py-8">
            <div className="">
                <div className="bg-background-secondary/50 py-8 px-16 rounded-md flex flex-col items-center shadow-shadow shadow-lg">
                    {/* Logo */}
                    <div className="text-center mb-4">
                        <h1 className="text-2xl font-light tracking-widest text-text-primary mb-6">
                            SANA
                        </h1>
                        <h2 className="text-xl font-light text-text-primary mb-3">
                            {step === 1 && "Just a quick verification"}
                            {step === 2 && "Enter OTP"}
                        </h2>
                        <p className="text-sm text-text-secondary font-light">
                            {step === 1 &&
                                "We will send you a one-time password to verify your number"}
                            {step === 2 && `OTP sent to +91${phone}`}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mt-4 p-3 text-sm text-danger">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Phone Number */}
                    {step === 1 && (
                        <form onSubmit={handleSendOTP} className="mt-8 w-65">
                            <div className="mb-6">
                                <label className="flex items-center gap-2 text-text-primary text-sm mb-3">
                                    <FaPhoneAlt className="text-base " />
                                    <span>Enter Mobile Number</span>
                                </label>
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
                                    placeholder="Mobile Number"
                                    className="w-full px-4 py-2 border-2 border-text-secondary/50 rounded-md bg-white text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-accent-1 focus:border-2"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || phone.length !== 10}
                                className="w-full py-2 bg-accent-1 text-text-primary-invert font-normal rounded-md hover:bg-accent-1/80 disabled:bg-text-secondary/50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? "Sending..." : "Get OTP"}
                            </button>
                        </form>
                    )}

                    {/* Step 2: OTP Verification */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyOTP} className="mt-8">
                            {/* Development OTP Display */}
                            {devOTP && (
                                <div className="mb-4 p-3 bg-yellow-50 border border-warning rounded text-sm">
                                    <p className="text-yellow-800 font-medium">
                                        Development Mode
                                    </p>
                                    <p className="text-yellow-700">
                                        OTP:{" "}
                                        <span className="font-mono font-bold">
                                            {devOTP}
                                        </span>
                                    </p>
                                </div>
                            )}

                            <div className="mb-6">
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
                                    placeholder="Enter OTP"
                                    className="w-full px-4 py-3 border border-divider rounded bg-white text-center text-2xl tracking-widest text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-text-primary"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full py-3 bg-background-secondary text-text-primary font-normal rounded hover:bg-accent-1 hover:text-white disabled:bg-divider disabled:text-text-secondary/50 disabled:cursor-not-allowed transition-colors mb-4"
                            >
                                {loading ? "Verifying..." : "Verify OTP"}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setStep(1);
                                    setOtp("");
                                    setError("");
                                    setDevOTP("");
                                }}
                                className="w-full text-sm text-text-primary hover:underline"
                            >
                                Change phone number
                            </button>
                        </form>
                    )}

                    {/* Footer */}
                    <p className="text-center text-xs text-text-primary mt-20 mb-12">
                        By continuing, I agree to the{" "}
                        <Link
                            to="/terms"
                            className="text-accent-1 underline font-semibold hover:text-accent-2"
                        >
                            Terms & Conditions
                        </Link>{" "}
                        and{" "}
                        <Link
                            to="/privacy"
                            className="text-accent-1 underline font-semibold hover:text-accent-2"
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
