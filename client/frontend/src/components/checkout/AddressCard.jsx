const AddressCard = ({ address, isSelected, onSelect }) => {
    const typeLabels = { home: "Home", office: "Office", other: "Other" };

    return (
        <button
            type="button"
            onClick={() => onSelect(address._id)}
            className={`w-full text-left p-4 rounded-sm border transition-colors ${
                isSelected
                    ? "border-text-primary bg-text-primary/5"
                    : "border-neutral-200 bg-white hover:border-neutral-400"
            }`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                    {/* Radio indicator */}
                    <div
                        className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                            isSelected
                                ? "border-text-primary"
                                : "border-neutral-400"
                        }`}
                    >
                        {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-text-primary" />
                        )}
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-text-primary text-sm">
                                {address.name}
                            </span>
                            <span className="text-xs text-text-secondary bg-neutral-100 px-1.5 py-0.5 rounded-xs capitalize">
                                {typeLabels[address.type] || address.type}
                            </span>
                            {address.isDefault && (
                                <span className="text-xs text-green-700 bg-green-50 px-1.5 py-0.5 rounded-xs">
                                    Default
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            {address.addressLine1}
                            {address.addressLine2 &&
                                `, ${address.addressLine2}`}
                        </p>
                        <p className="text-sm text-text-secondary">
                            {address.city}, {address.state} — {address.pincode}
                        </p>
                        <p className="text-sm text-text-secondary mt-0.5">
                            {address.phone}
                        </p>
                    </div>
                </div>
            </div>
        </button>
    );
};

export default AddressCard;
