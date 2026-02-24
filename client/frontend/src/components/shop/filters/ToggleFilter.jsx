/**
 * Reusable toggle filter for boolean values
 * Used for In Stock, On Sale, New Arrivals, Customizable
 */
const ToggleFilter = ({ label, value, onChange }) => {
    return (
        <label className="flex cursor-pointer items-center justify-between rounded px-2 py-2 hover:bg-background-secondary transition-colors">
            <span className="text-sm text-text-primary">{label}</span>
            <div className="relative">
                <input
                    type="checkbox"
                    checked={value || false}
                    onChange={(e) => onChange(e.target.checked)}
                    className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-gray-300 peer-checked:bg-accent-1 transition-colors"></div>
                <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
            </div>
        </label>
    );
};

export default ToggleFilter;
