import { useState } from "react";
import { IoChevronDown } from "react-icons/io5";

/**
 * Collapsible filter section wrapper
 * Used to group related filter options
 */
const FilterSection = ({ title, defaultOpen = false, children }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="mb-3 flex w-full items-center justify-between text-left text-text-primary hover:text-accent-1"
            >
                <span className="">{title}</span>
                <IoChevronDown
                    className={`h-4 w-4  transition-transform ${
                        isOpen ? "rotate-180" : ""
                    }`}
                />
            </button>
            {isOpen && <div className="space-y-2">{children}</div>}
        </div>
    );
};

export default FilterSection;
