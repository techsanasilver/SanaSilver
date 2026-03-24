const PaymentMethodSelector = ({ selectedMethod, onMethodSelect }) => {
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
                        {/* COD icon */}
                        <div className="w-8 h-8 bg-neutral-100 rounded-xs flex items-center justify-center shrink-0">
                            <svg
                                className="w-4 h-4 text-text-secondary"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                            </svg>
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

            {/* Razorpay — placeholder, disabled */}
            <div className="w-full p-4 rounded-sm border border-neutral-200 bg-neutral-50 opacity-60 cursor-not-allowed">
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 border-neutral-300 shrink-0" />
                    <div className="flex items-center gap-3">
                        {/* Razorpay icon placeholder */}
                        <div className="w-8 h-8 bg-neutral-200 rounded-xs flex items-center justify-center shrink-0">
                            <svg
                                className="w-4 h-4 text-neutral-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                />
                            </svg>
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
        </div>
    );
};

export default PaymentMethodSelector;
