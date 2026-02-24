import { useState, useEffect } from "react";
import FilterSection from "./FilterSection";

/**
 * Price range filter with min and max inputs
 */
const PriceRangeFilter = ({ minPrice, maxPrice, onMinChange, onMaxChange }) => {
    const [localMin, setLocalMin] = useState(minPrice || "");
    const [localMax, setLocalMax] = useState(maxPrice || "");

    // Sync with external values
    useEffect(() => {
        setLocalMin(minPrice || "");
    }, [minPrice]);

    useEffect(() => {
        setLocalMax(maxPrice || "");
    }, [maxPrice]);

    const handleMinBlur = () => {
        if (localMin !== "" && !isNaN(localMin)) {
            onMinChange(parseFloat(localMin));
        } else if (localMin === "") {
            onMinChange(null);
        }
    };

    const handleMaxBlur = () => {
        if (localMax !== "" && !isNaN(localMax)) {
            onMaxChange(parseFloat(localMax));
        } else if (localMax === "") {
            onMaxChange(null);
        }
    };

    return (
        <FilterSection title="Price Range">
            <div className="flex items-center gap-2">
                <div className="flex-1">
                    <input
                        type="number"
                        placeholder="Min"
                        value={localMin}
                        onChange={(e) => setLocalMin(e.target.value)}
                        onBlur={handleMinBlur}
                        min="0"
                        className="w-full rounded-md border border-divider px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent-1"
                    />
                </div>
                <span className="text-text-secondary">-</span>
                <div className="flex-1">
                    <input
                        type="number"
                        placeholder="Max"
                        value={localMax}
                        onChange={(e) => setLocalMax(e.target.value)}
                        onBlur={handleMaxBlur}
                        min="0"
                        className="w-full rounded-md border border-divider px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent-1"
                    />
                </div>
            </div>
        </FilterSection>
    );
};

export default PriceRangeFilter;
