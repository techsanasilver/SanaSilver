import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sendOTP, verifyOTP } from "../api/auth.api";
import logger from "../utils/logger.util";
import Loader from "../components/common/Loader";
import { FaPhoneAlt } from "react-icons/fa";
import { IoKeyOutline } from "react-icons/io5";

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated, isLoading } = useAuth();

    const [step, setStep] = useState(1); // 1 = phone, 2 = OTP
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Refs for OTP input boxes
    const otpRefs = useRef([]);

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

        if (phone.length !== 10) {
            setError("Please enter a valid 10-digit phone number");
            return;
        }

        setLoading(true);

        try {
            const response = await sendOTP(`+91${phone}`);

            // Log OTP to console in development
            if (response.data?.data?.otp) {
                console.log("🔐 OTP:", response.data.data.otp);
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

    const handleResendOTP = async () => {
        setError("");
        setLoading(true);

        try {
            const response = await sendOTP(`+91${phone}`);

            // Log OTP to console in development
            if (response.data?.data?.otp) {
                console.log("🔐 Resent OTP:", response.data.data.otp);
            }

            logger.info("OTP resent successfully");
        } catch (err) {
            const errorMsg =
                err.response?.data?.message ||
                "Failed to resend OTP. Please try again.";
            setError(errorMsg);
            logger.error("Resend OTP failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        // Only allow single digit
        if (value.length > 1) return;

        // Only allow numbers
        if (value && !/^\d+$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, 6);

        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = pastedData.split("");
        while (newOtp.length < 6) {
            newOtp.push("");
        }
        setOtp(newOtp);

        // Focus last filled input or first empty
        const nextIndex = Math.min(pastedData.length, 5);
        otpRefs.current[nextIndex]?.focus();
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError("");

        const otpString = otp.join("");

        if (otpString.length !== 6) {
            setError("Please enter a valid 6-digit OTP");
            return;
        }

        setLoading(true);

        try {
            const response = await verifyOTP(`+91${phone}`, otpString);
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
                            {step === 2 && "Just a quick verification"}
                        </h2>
                        <p className="text-sm text-text-secondary font-light">
                            {step === 1 &&
                                "We will send you a one-time password to verify your number"}
                            {step === 2 &&
                                `We have sent a 6-digit OTP to ${phone.slice(0, 3)}${"*".repeat(7)}`}
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
                        <form onSubmit={handleVerifyOTP} className="mt-8 w-65">
                            <div className="mb-6">
                                <label className="flex items-center gap-2 text-text-primary text-sm mb-3">
                                    <IoKeyOutline className="text-base" />
                                    <span>Enter OTP</span>
                                </label>

                                {/* 6 OTP Input Boxes */}
                                <div className="flex gap-2 justify-between">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) =>
                                                (otpRefs.current[index] = el)
                                            }
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) =>
                                                handleOtpChange(
                                                    index,
                                                    e.target.value,
                                                )
                                            }
                                            onKeyDown={(e) =>
                                                handleOtpKeyDown(index, e)
                                            }
                                            onPaste={
                                                index === 0
                                                    ? handleOtpPaste
                                                    : undefined
                                            }
                                            className="w-9 h-9 text-center text-lg border-2 border-text-secondary/50 rounded-md bg-white text-text-primary focus:outline-none focus:border-accent-1 focus:border-2"
                                            required
                                        />
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.join("").length !== 6}
                                className="w-full py-2 bg-accent-1 text-text-primary-invert font-normal rounded-md hover:bg-accent-1/80 disabled:bg-text-secondary/50 disabled:cursor-not-allowed transition-colors mb-3"
                            >
                                {loading ? "Verifying..." : "Verify OTP"}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setStep(1);
                                    setOtp(["", "", "", "", "", ""]);
                                    setError("");
                                }}
                                className="w-full py-2 bg-accent-2 text-text-primary-invert font-normal rounded-md hover:bg-accent-2/80 transition-colors"
                            >
                                Change Mobile Number
                            </button>

                            <div className="flex justify-end mt-3">
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    disabled={loading}
                                    className="text-xs text-text-primary underline hover:text-accent-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    RESEND OTP
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Footer */}
                    <p
                        className={`text-center text-xs text-text-primary mb-12 ${step == 1 ? "mt-20" : "mt-8"}`}
                    >
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
