import { MdInventory2 } from "react-icons/md";

const EmptyState = ({ hasFilters, onClearFilters }) => {
    return (
        <div className="flex min-h-100 items-center justify-center rounded-lg bg-white p-12 shadow-sm">
            <div className="text-center">
                {/* Icon */}
                <MdInventory2 className="mx-auto h-16 w-16 text-text-secondary opacity-50" />

                {/* Message */}
                <h3 className="mt-4 text-lg font-medium text-text-primary">
                    {hasFilters ? "No products found" : "No products available"}
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                    {hasFilters
                        ? "Try adjusting your filters or search criteria"
                        : "Check back later for new products"}
                </p>

                {/* Clear Filters Button */}
                {hasFilters && onClearFilters && (
                    <button
                        onClick={onClearFilters}
                        className="mt-6 rounded-md bg-accent-1 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    >
                        Clear All Filters
                    </button>
                )}
            </div>
        </div>
    );
};

export default EmptyState;
