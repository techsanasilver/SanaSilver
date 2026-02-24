import FilterSection from "./FilterSection";

/**
 * Reusable multi-select checkbox filter
 * Used for categories, collections, gender, etc.
 */
const CheckboxFilter = ({ title, options, selectedValues = [], onChange }) => {
    const handleToggle = (value) => {
        // Case-insensitive comparison
        const isSelected = selectedValues.some(
            (v) => v.toLowerCase() === value.toLowerCase(),
        );
        let newValues;

        if (isSelected) {
            // Remove value (case-insensitive)
            newValues = selectedValues.filter(
                (v) => v.toLowerCase() !== value.toLowerCase(),
            );
        } else {
            // Add value
            newValues = [...selectedValues, value];
        }

        onChange(newValues.length > 0 ? newValues : null);
    };

    return (
        <FilterSection title={title}>
            <div className="space-y-2 overflow-y-auto">
                {options.map((option) => {
                    const value =
                        typeof option === "string" ? option : option.value;
                    const label =
                        typeof option === "string" ? option : option.label;
                    // Case-insensitive comparison for selected state
                    const isSelected = selectedValues.some(
                        (v) => v.toLowerCase() === value.toLowerCase(),
                    );

                    return (
                        <label
                            key={value}
                            className="flex cursor-pointer items-center gap-2 hover:bg-background-secondary rounded px-2 py-1 transition-colors"
                        >
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggle(value)}
                                className="appearance-none h-4 w-4 rounded-xs border border-divider cursor-pointer transition-all hover:border-accent-1 checked:bg-accent-1 checked:border-accent-1 focus:outline-none relative checked:after:content-[''] checked:after:absolute checked:after:left-1 checked:after:top-[0.05rem] checked:after:w-[0.35rem] checked:after:h-[0.6rem] checked:after:border-white checked:after:border-r-2 checked:after:border-b-2 checked:after:rotate-45"
                            />
                            <span className="flex-1 text-sm text-text-primary">
                                {label}
                            </span>
                        </label>
                    );
                })}
            </div>
        </FilterSection>
    );
};

export default CheckboxFilter;
