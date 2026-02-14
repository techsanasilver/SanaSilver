import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sendOTP, verifyOTP } from "../api/auth.api";
import logger from "../utils/logger.util";
import Loader from "../components/common/Loader";

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
        <div className="min-h-screen flex items-center justify-center bg-primary px-4">
            <div className="w-full max-w-md">
                <div className="bg-background-secondary/20 p-8 rounded-lg shadow-md">
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
                            {/* Development OTP Display */}
                            {devOTP && (
                                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
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
