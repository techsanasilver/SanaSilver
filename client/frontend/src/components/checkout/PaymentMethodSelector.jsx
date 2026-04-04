import { TbTruckDelivery } from "react-icons/tb";
import { MdOutlineCreditCard } from "react-icons/md";

const PaymentMethodSelector = ({
    selectedMethod,
    onMethodSelect,
    razorpayEnabled = false,
}) => {
    return (
        <div className="space-y-3">
            {/* Cash on Delivery */}
            <button
                type="button"
                onClick={() => onMethodSelect("cod")}
                className={`w-full text-left p-4 rounded-sm border transition-colors ${
                    selectedMethod === "cod"
                        ? "border-text-primary bg-text-primary/5"
                        : "border-neutral-200 bg-white hover:border-neutral-400"
                }`}
            >
                <div className="flex items-center gap-3">
                    <div
                        className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                            selectedMethod === "cod"
                                ? "border-text-primary"
                                : "border-neutral-400"
                        }`}
                    >
                        {selectedMethod === "cod" && (
                            <div className="w-2 h-2 rounded-full bg-text-primary" />
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-neutral-100 rounded-xs flex items-center justify-center shrink-0">
                            <TbTruckDelivery className="w-5 h-5 text-text-secondary" />
                        </div>
                        <div>
                            <p className="font-medium text-sm text-text-primary">
                                Cash on Delivery
                            </p>
                            <p className="text-xs text-text-secondary">
                                Pay when your order arrives
                            </p>
                        </div>
                    </div>
                </div>
            </button>

            {/* Razorpay — enabled/disabled based on backend config */}
            {razorpayEnabled ? (
                <button
                    type="button"
                    onClick={() => onMethodSelect("razorpay")}
                    className={`w-full text-left p-4 rounded-sm border transition-colors ${
                        selectedMethod === "razorpay"
                            ? "border-text-primary bg-text-primary/5"
                            : "border-neutral-200 bg-white hover:border-neutral-400"
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                                selectedMethod === "razorpay"
                                    ? "border-text-primary"
                                    : "border-neutral-400"
                            }`}
                        >
                            {selectedMethod === "razorpay" && (
                                <div className="w-2 h-2 rounded-full bg-text-primary" />
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-neutral-100 rounded-xs flex items-center justify-center shrink-0">
                                <MdOutlineCreditCard className="w-5 h-5 text-text-secondary" />
                            </div>
                            <div>
                                <p className="font-medium text-sm text-text-primary">
                                    Online Payment (Razorpay)
                                </p>
                                <p className="text-xs text-text-secondary">
                                    UPI, Cards, Net Banking
                                </p>
                            </div>
                        </div>
                    </div>
                </button>
            ) : (
                <div className="w-full p-4 rounded-sm border border-neutral-200 bg-neutral-50 opacity-60 cursor-not-allowed">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border-2 border-neutral-300 shrink-0" />
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-neutral-200 rounded-xs flex items-center justify-center shrink-0">
                                <MdOutlineCreditCard className="w-5 h-5 text-neutral-400" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm text-text-primary">
                                        Online Payment (Razorpay)
                                    </p>
                                    <span className="text-xs text-white bg-neutral-400 px-1.5 py-0.5 rounded-xs">
                                        Coming Soon
                                    </span>
                                </div>
                                <p className="text-xs text-text-secondary">
                                    UPI, Cards, Net Banking
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentMethodSelector;
