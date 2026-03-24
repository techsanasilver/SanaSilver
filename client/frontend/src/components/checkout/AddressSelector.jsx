import { Link } from "react-router-dom";
import AddressCard from "./AddressCard";

const AddressSelector = ({
    addresses,
    selectedAddressId,
    onAddressSelect,
    label,
}) => {
    if (!addresses || addresses.length === 0) {
        return (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-sm text-sm text-amber-800">
                No saved addresses found.{" "}
                <Link
                    to="/profile"
                    className="underline font-medium hover:text-amber-900"
                >
                    Add one in your Profile
                </Link>{" "}
                before continuing.
            </div>
        );
    }

    return (
        <div>
            {label && (
                <p className="text-xs text-text-secondary uppercase tracking-wider mb-3">
                    {label}
                </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addresses.map((address) => (
                    <AddressCard
                        key={address._id}
                        address={address}
                        isSelected={selectedAddressId === address._id}
                        onSelect={onAddressSelect}
                    />
                ))}
            </div>
        </div>
    );
};

export default AddressSelector;
