import React from "react";
import {
    MdKeyboardArrowLeft,
    MdKeyboardArrowRight,
    MdFirstPage,
    MdLastPage,
} from "react-icons/md";

/**
 * Pagination Component
 * @param {Object} props
 * @param {number} props.currentPage - Current active page
 * @param {number} props.totalPages - Total number of pages
 * @param {Function} props.onPageChange - Callback when page changes
 * @param {number} props.totalItems - Total number of items
 * @param {number} props.itemsPerPage - Items per page
 * @param {boolean} props.hasNextPage - Whether next page exists
 * @param {boolean} props.hasPrevPage - Whether previous page exists
 */
const Pagination = ({
    currentPage = 1,
    totalPages = 1,
    onPageChange,
    totalItems = 0,
    itemsPerPage = 20,
    hasNextPage = false,
    hasPrevPage = false,
}) => {
    if (totalPages <= 1) return null;

    // Calculate start and end items for display
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Generate page numbers to display (max 5 pages)
    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            // Show all pages if total is less than max
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            // Calculate range around current page
            let startPage = Math.max(2, currentPage - 1);
            let endPage = Math.min(totalPages - 1, currentPage + 1);

            // Add ellipsis after first page if needed
            if (startPage > 2) {
                pages.push("...");
            }

            // Add pages around current page
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            // Add ellipsis before last page if needed
            if (endPage < totalPages - 1) {
                pages.push("...");
            }

            // Always show last page
            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Items Info */}
            <div className="text-sm text-text-secondary">
                {/* Showing {startItem} to {endItem} of {totalItems} items */}
                Showing {currentPage} of {totalPages} pages
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
                {/* First Page */}
                <button
                    onClick={() => onPageChange(1)}
                    disabled={!hasPrevPage}
                    className="p-2 rounded-lg border border-border hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="First Page"
                >
                    <MdFirstPage size={20} />
                </button>

                {/* Previous Page */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={!hasPrevPage}
                    className="p-2 rounded-lg border border-border hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Previous Page"
                >
                    <MdKeyboardArrowLeft size={20} />
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                    {pageNumbers.map((page, index) =>
                        page === "..." ? (
                            <span
                                key={`ellipsis-${index}`}
                                className="px-2 text-text-secondary"
                            >
                                ...
                            </span>
                        ) : (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                className={`px-3 py-1 rounded-lg transition-colors ${
                                    page === currentPage
                                        ? "bg-primary text-white font-medium"
                                        : "border border-border hover:bg-background text-text"
                                }`}
                            >
                                {page}
                            </button>
                        ),
                    )}
                </div>

                {/* Next Page */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!hasNextPage}
                    className="p-2 rounded-lg border border-border hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Next Page"
                >
                    <MdKeyboardArrowRight size={20} />
                </button>

                {/* Last Page */}
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={!hasNextPage}
                    className="p-2 rounded-lg border border-border hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Last Page"
                >
                    <MdLastPage size={20} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
