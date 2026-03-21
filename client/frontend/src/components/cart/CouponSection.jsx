import { useState, useEffect } from "react";
import { FiTag, FiChevronDown, FiX, FiCheck, FiLoader } from "react-icons/fi";
import { useCart } from "../../context/CartContext";
import { getAvailableCoupons } from "../../api/coupon.api";
import { useAuth } from "../../context/AuthContext";

const CouponSection = () => {
    const { isAuthenticated } = useAuth();
    const {
        appliedCoupon,
        couponLoading,
        couponError,
        setCouponError,
        applyCartCoupon,
        removeCartCoupon,
    } = useCart();

    const [inputCode, setInputCode] = useState("");
    const [showAvailable, setShowAvailable] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [availableLoading, setAvailableLoading] = useState(false);
    const [availableError, setAvailableError] = useState(null);

    // Clear input error when user types
    useEffect(() => {
        if (inputCode) setCouponError(null);
    }, [inputCode, setCouponError]);

    const handleApply = () => {
        if (!inputCode.trim()) return;
        applyCartCoupon(inputCode.trim());
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleApply();
    };

    const handleToggleAvailable = async () => {
        if (showAvailable) {
            setShowAvailable(false);
            setAvailableCoupons([]); // reset so next open re-fetches fresh data
            return;
        }
        setShowAvailable(true);
        if (availableCoupons.length > 0) return; // already loaded
        setAvailableLoading(true);
        setAvailableError(null);
        try {
            const resp = await getAvailableCoupons();
            setAvailableCoupons(resp.data.data || []);
        } catch {
            setAvailableError("Failed to load coupons. Please try again.");
        } finally {
            setAvailableLoading(false);
        }
    };

    const handleSelectCoupon = (code) => {
        setInputCode(code);
        setShowAvailable(false);
        applyCartCoupon(code);
    };

    const formatDiscount = (coupon) => {
        if (coupon.discountType === "percentage") {
            const label = `${coupon.discountValue}% off`;
            return coupon.maxDiscount
                ? `${label} (up to ₹${coupon.maxDiscount})`
                : label;
        }
        if (coupon.discountType === "flat")
            return `₹${coupon.discountValue} off`;
        if (coupon.discountType === "free_shipping") return "Free shipping";
        return "";
    };

    // Guest user — show non-intrusive note
    if (!isAuthenticated) {
        return (
            <div className="py-3 text-xs text-text-secondary text-center border border-dashed border-neutral-300 rounded-xs">
                <FiTag className="inline-block mr-1.5 mb-0.5" />
                <span>
                    <button
                        className="underline underline-offset-2 text-text-primary/70 hover:text-text-primary transition-colors"
                        onClick={() => window.location.assign("/login")}
                    >
                        Log in
                    </button>{" "}
                    to apply coupon codes
                </span>
            </div>
        );
    }

    // Coupon already applied — show pill
    if (appliedCoupon) {
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2.5 bg-green-50 border border-green-200 rounded-xs">
                    <div className="flex items-center gap-2 min-w-0">
                        <FiCheck
                            className="text-green-600 shrink-0"
                            size={15}
                        />
                        <div className="min-w-0">
                            <span className="text-sm font-medium text-green-800 tracking-wide">
                                {appliedCoupon.code}
                            </span>
                            {appliedCoupon.description && (
                                <p className="text-xs text-green-700 truncate">
                                    {appliedCoupon.description}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={removeCartCoupon}
                        className="ml-3 p-1 text-green-700 hover:text-red-600 transition-colors shrink-0"
                        aria-label="Remove coupon"
                    >
                        <FiX size={15} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Manual entry */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter coupon code"
                    maxLength={30}
                    className={`flex-1 min-w-0 px-3 py-2.5 text-sm bg-white border rounded-xs focus:outline-none focus:border-text-primary transition-colors placeholder:text-text-secondary/50 ${
                        couponError ? "border-red-400" : "border-neutral-300"
                    }`}
                />
                <button
                    onClick={handleApply}
                    disabled={couponLoading || !inputCode.trim()}
                    className="px-4 py-2.5 text-sm font-medium bg-text-primary text-white rounded-xs hover:bg-text-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                    {couponLoading ? (
                        <FiLoader className="animate-spin" size={15} />
                    ) : (
                        "APPLY"
                    )}
                </button>
            </div>

            {/* Error message */}
            {couponError && (
                <p className="text-xs text-red-600">{couponError}</p>
            )}

            {/* View available coupons toggle */}
            <button
                onClick={handleToggleAvailable}
                className="flex items-center gap-1.5 text-xs text-text-primary/70 hover:text-text-primary transition-colors"
            >
                <FiTag size={12} />
                <span>View available coupons</span>
                <FiChevronDown
                    size={13}
                    className={`transition-transform duration-200 ${
                        showAvailable ? "rotate-180" : ""
                    }`}
                />
            </button>

            {/* Available coupons drawer */}
            <div
                className={`overflow-hidden transition-all duration-300 ${
                    showAvailable ? "max-h-100" : "max-h-0"
                }`}
            >
                <div className="pt-1 space-y-2">
                    {availableLoading && (
                        <div className="flex items-center gap-2 py-4 text-text-secondary text-sm">
                            <FiLoader className="animate-spin" size={14} />
                            <span>Loading coupons...</span>
                        </div>
                    )}

                    {availableError && (
                        <p className="text-xs text-red-600 py-2">
                            {availableError}
                        </p>
                    )}

                    {!availableLoading &&
                        !availableError &&
                        availableCoupons.length === 0 && (
                            <p className="text-xs text-text-secondary py-2">
                                No coupons available right now.
                            </p>
                        )}

                    {!availableLoading &&
                        availableCoupons.map((coupon) => (
                            <div
                                key={coupon.code}
                                className={`border rounded-xs p-3 transition-colors ${
                                    coupon.isApplicable
                                        ? "border-neutral-200 bg-white hover:border-text-primary cursor-pointer"
                                        : "border-neutral-200 bg-neutral-50 opacity-60 cursor-default"
                                }`}
                                onClick={() =>
                                    coupon.isApplicable &&
                                    handleSelectCoupon(coupon.code)
                                }
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-mono font-semibold text-text-primary tracking-wider">
                                                {coupon.code}
                                            </span>
                                            <span className="text-xs text-accent-1 font-medium">
                                                {formatDiscount(coupon)}
                                            </span>
                                        </div>
                                        {coupon.description && (
                                            <p className="text-xs text-text-secondary mt-0.5">
                                                {coupon.description}
                                            </p>
                                        )}
                                        {coupon.minOrderValue > 0 && (
                                            <p className="text-xs text-text-secondary mt-0.5">
                                                Min. order: ₹
                                                {coupon.minOrderValue}
                                            </p>
                                        )}
                                        {!coupon.isApplicable &&
                                            coupon.applicabilityReason && (
                                                <p className="text-xs text-amber-600 mt-1">
                                                    {coupon.applicabilityReason}
                                                </p>
                                            )}
                                    </div>
                                    {coupon.isApplicable && (
                                        <span className="text-xs text-text-primary/60 hover:text-text-primary underline underline-offset-2 shrink-0 mt-0.5 transition-colors">
                                            Apply
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default CouponSection;
