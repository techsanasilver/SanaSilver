import { useState, useRef, useEffect } from "react";
import { HiOutlineAdjustmentsHorizontal } from "react-icons/hi2";
import { HiOutlineBars3 } from "react-icons/hi2";
import { IoMdClose } from "react-icons/io";
import { FiChevronDown } from "react-icons/fi";
import useProductFilters from "../hooks/useProductFilters";
import useInfiniteProducts from "../hooks/useInfiniteProducts";
import LoadingState from "../components/shop/LoadingState";
import EmptyState from "../components/shop/EmptyState";
import ProductCard from "../components/products/ProductCard";
import CategoryFilter from "../components/shop/filters/CategoryFilter";
import PriceRangeFilter from "../components/shop/filters/PriceRangeFilter";
import CheckboxFilter from "../components/shop/filters/CheckboxFilter";
import SingleCheckboxFilter from "../components/shop/filters/SingleCheckboxFilter";
import ToggleFilter from "../components/shop/filters/ToggleFilter";
import FilterSection from "../components/shop/filters/FilterSection";
import { useCategories } from "../context/CategoryContext";

const Shop = () => {
    const {
        filters,
        setFilter,
        setFilters,
        clearAllFilters,
        activeFilterCount,
    } = useProductFilters();
    const {
        products,
        loading,
        loadingMore,
        error,
        totalCount,
        lastProductRef,
        isFirstLoad,
    } = useInfiniteProducts(filters);
    const { categories } = useCategories();

    // Mobile filter/sort sheet states
    const [showFilters, setShowFilters] = useState(false);
    const [showSort, setShowSort] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const sortDropdownRef = useRef(null);

    // Close sort dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                sortDropdownRef.current &&
                !sortDropdownRef.current.contains(event.target)
            ) {
                setShowSortDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Sort options
    const sortOptions = [
        { value: "newest", label: "Newest" },
        { value: "price-asc", label: "Price: Low to High" },
        { value: "price-desc", label: "Price: High to Low" },
        { value: "name-asc", label: "Name: A to Z" },
        { value: "name-desc", label: "Name: Z to A" },
    ];

    const currentSort = sortOptions.find(
        (opt) => opt.value === (filters.sortBy || "newest"),
    );

    return (
        <div className="min-h-screen bg-background-primary">
            {/* Toolbar - Full Width Above Everything (Desktop Only) */}
            <div className="hidden lg:block sticky top-0 z-30 bg-background-secondary border-b border-divider">
                <div className="px-4 lg:px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                        {/* Left: Search Term */}
                        <div className="flex-1">
                            {filters.search && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-text-secondary">
                                        Searching for:
                                    </span>
                                    <span className="text-sm font-medium text-text-primary">
                                        "{filters.search}"
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Center: Product Count */}
                        <div className="flex-1 flex justify-center">
                            <p className="text-lg font-medium text-accent-2 tracking-widest">
                                {isFirstLoad && loading
                                    ? "Loading products..."
                                    : `${totalCount} ${totalCount === 1 ? "PRODUCT" : "PRODUCTS"}`}
                            </p>
                        </div>

                        {/* Right: Sort Dropdown */}
                        <div className="flex-1 flex justify-end">
                            <div className="relative" ref={sortDropdownRef}>
                                <button
                                    onClick={() =>
                                        setShowSortDropdown(!showSortDropdown)
                                    }
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-primary hover:text-accent-2 transition-colors border border-divider rounded-sm bg-background-primary"
                                >
                                    <span>Sort: {currentSort?.label}</span>
                                    <FiChevronDown
                                        className={`w-4 h-4 transition-transform duration-200 ${
                                            showSortDropdown ? "rotate-180" : ""
                                        }`}
                                    />
                                </button>

                                {showSortDropdown && (
                                    <div className="absolute right-0 top-full mt-1 w-56 bg-background-primary border border-divider rounded-sm shadow-lg overflow-hidden z-50">
                                        <div className="py-1">
                                            {sortOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        setFilter(
                                                            "sortBy",
                                                            option.value,
                                                        );
                                                        setShowSortDropdown(
                                                            false,
                                                        );
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                                        filters.sortBy ===
                                                            option.value ||
                                                        (!filters.sortBy &&
                                                            option.value ===
                                                                "newest")
                                                            ? "bg-background-secondary text-text-primary font-medium"
                                                            : "text-text-secondary hover:bg-background-secondary hover:text-text-primary"
                                                    }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Layout */}
            <div className="flex gap-6 px-4 py-8 lg:gap-8 lg:px-6">
                {/* Left Sidebar - Desktop Only */}
                <aside className="hidden w-[20vw] max-w-56 shrink-0 lg:block">
                    <div className="sticky top-20 ">
                        <div className=" rounded-sm p-6 max-h-[calc(100vh-10rem)] overflow-y-auto ">
                            <div className="mb-8 flex items-center justify-between">
                                <h2 className="text-2xl font-semibold text-text-primary">
                                    FILTERS
                                </h2>
                                {activeFilterCount > 0 && (
                                    <button
                                        onClick={clearAllFilters}
                                        className="text-sm text-accent-1 hover:opacity-80"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                            {/* Filters */}
                            <div className="space-y-6">
                                {/* Category & Subcategory */}
                                <CategoryFilter
                                    categories={categories}
                                    category={filters.category}
                                    subcategory={filters.subcategory}
                                    onCategoryChange={(val) =>
                                        setFilters({
                                            category: val,
                                            subcategory: null,
                                        })
                                    }
                                    onSubcategoryChange={(val) =>
                                        setFilter("subcategory", val)
                                    }
                                />

                                {/* Price Range */}
                                <PriceRangeFilter
                                    minPrice={filters.minPrice}
                                    maxPrice={filters.maxPrice}
                                    onMinChange={(val) =>
                                        setFilter("minPrice", val)
                                    }
                                    onMaxChange={(val) =>
                                        setFilter("maxPrice", val)
                                    }
                                />

                                {/* Gender */}
                                <CheckboxFilter
                                    title="Gender"
                                    options={[
                                        { value: "men", label: "Men's" },
                                        { value: "women", label: "Women's" },
                                        { value: "unisex", label: "Unisex" },
                                    ]}
                                    selectedValues={filters.gender || []}
                                    onChange={(val) => setFilter("gender", val)}
                                />

                                {/* Purity */}
                                <SingleCheckboxFilter
                                    title="Purity"
                                    options={["925", "999"]}
                                    selectedValue={filters.purity || null}
                                    onChange={(val) => setFilter("purity", val)}
                                />

                                {/* Gemstone */}
                                <CheckboxFilter
                                    title="Gemstone"
                                    options={[
                                        { value: "diamond", label: "Diamond" },
                                        { value: "ruby", label: "Ruby" },
                                        { value: "emerald", label: "Emerald" },
                                        {
                                            value: "sapphire",
                                            label: "Sapphire",
                                        },
                                        { value: "pearl", label: "Pearl" },
                                        { value: "topaz", label: "Topaz" },
                                        {
                                            value: "amethyst",
                                            label: "Amethyst",
                                        },
                                        { value: "none", label: "None" },
                                    ]}
                                    selectedValues={filters.gemstone || []}
                                    onChange={(val) =>
                                        setFilter("gemstone", val)
                                    }
                                />

                                {/* Occasion */}
                                <CheckboxFilter
                                    title="Occasion"
                                    options={[
                                        { value: "wedding", label: "Wedding" },
                                        {
                                            value: "engagement",
                                            label: "Engagement",
                                        },
                                        { value: "casual", label: "Casual" },
                                        { value: "formal", label: "Formal" },
                                        { value: "party", label: "Party" },
                                        {
                                            value: "dailywear",
                                            label: "Daily Wear",
                                        },
                                        {
                                            value: "festival",
                                            label: "Festival",
                                        },
                                    ]}
                                    selectedValues={filters.occasion || []}
                                    onChange={(val) =>
                                        setFilter("occasion", val)
                                    }
                                />

                                {/* Plating */}
                                <CheckboxFilter
                                    title="Plating"
                                    options={[
                                        { value: "gold", label: "Gold" },
                                        {
                                            value: "rosegold",
                                            label: "Rose Gold",
                                        },
                                        { value: "rhodium", label: "Rhodium" },
                                        {
                                            value: "whitegold",
                                            label: "White Gold",
                                        },
                                        // { value: "none", label: "None" },
                                    ]}
                                    selectedValues={filters.plating || []}
                                    onChange={(val) =>
                                        setFilter("plating", val)
                                    }
                                />

                                {/* Boolean Filters */}
                                <FilterSection title="More Filters">
                                    <div className="space-y-1">
                                        <ToggleFilter
                                            label="In Stock"
                                            value={filters.inStock}
                                            onChange={(val) =>
                                                setFilter(
                                                    "inStock",
                                                    val || null,
                                                )
                                            }
                                        />
                                        <ToggleFilter
                                            label="On Sale"
                                            value={filters.onSale}
                                            onChange={(val) =>
                                                setFilter("onSale", val || null)
                                            }
                                        />
                                        <ToggleFilter
                                            label="New Arrivals"
                                            value={filters.newArrivals}
                                            onChange={(val) =>
                                                setFilter(
                                                    "newArrivals",
                                                    val || null,
                                                )
                                            }
                                        />
                                        <ToggleFilter
                                            label="Customizable"
                                            value={filters.customizable}
                                            onChange={(val) =>
                                                setFilter(
                                                    "customizable",
                                                    val || null,
                                                )
                                            }
                                        />
                                    </div>
                                </FilterSection>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="min-w-0 flex-1">
                    {/* Products Grid */}
                    {error ? (
                        <div className="rounded-lg bg-white p-8 text-center shadow-sm">
                            <p className="text-danger">{error}</p>
                        </div>
                    ) : loading || (products.length === 0 && isFirstLoad) ? (
                        <LoadingState count={16} />
                    ) : products.length === 0 ? (
                        <EmptyState
                            hasFilters={activeFilterCount > 0}
                            onClearFilters={clearAllFilters}
                        />
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6 xl:grid-cols-4">
                                {products.map((product, index) => {
                                    // Attach ref to last product for infinite scroll
                                    if (index === products.length - 1) {
                                        return (
                                            <div
                                                key={product._id}
                                                ref={lastProductRef}
                                            >
                                                <ProductCard
                                                    product={product}
                                                    showBadge={true}
                                                />
                                            </div>
                                        );
                                    }
                                    return (
                                        <ProductCard
                                            key={product._id}
                                            product={product}
                                            showBadge={true}
                                        />
                                    );
                                })}
                            </div>

                            {/* Loading indicator for infinite scroll */}
                            {loadingMore && (
                                // <div className="mt-8 text-center">
                                //     <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-background-secondary border-t-accent-1"></div>
                                //     <p className="mt-2 text-sm text-text-secondary">
                                //         Loading more products...
                                //     </p>
                                // </div>
                                <LoadingState count={12} />
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* Mobile Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-10 bg-white shadow-lg lg:hidden">
                <div className="flex divide-x divide-divider">
                    <button
                        onClick={() => setShowFilters(true)}
                        className="flex flex-1 items-center justify-center gap-2 py-4 text-text-primary hover:bg-background-primary"
                    >
                        <HiOutlineAdjustmentsHorizontal className="h-5 w-5" />
                        <span className="font-medium">
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent-1 text-xs text-white">
                                    {activeFilterCount}
                                </span>
                            )}
                        </span>
                    </button>
                    <button
                        onClick={() => setShowSort(true)}
                        className="flex flex-1 items-center justify-center gap-2 py-4 text-text-primary hover:bg-background-primary"
                    >
                        <HiOutlineBars3 className="h-5 w-5" />
                        <span className="font-medium">Sort</span>
                    </button>
                </div>
            </div>

            {/* Mobile Filter Sheet - Placeholder */}
            {showFilters && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 lg:hidden">
                    <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white">
                        <div className="sticky top-0 z-10 border-b border-divider bg-white px-4 py-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-text-primary">
                                    Filters
                                </h2>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="text-text-secondary hover:text-text-primary"
                                >
                                    <IoMdClose className="h-6 w-6" />
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <p className="text-sm text-text-secondary">
                                Mobile filters coming in Phase 4...
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Sort Sheet - Placeholder */}
            {showSort && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 lg:hidden">
                    <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white">
                        <div className="border-b border-divider px-4 py-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-text-primary">
                                    Sort By
                                </h2>
                                <button
                                    onClick={() => setShowSort(false)}
                                    className="text-text-secondary hover:text-text-primary"
                                >
                                    <IoMdClose className="h-6 w-6" />
                                </button>
                            </div>
                        </div>
                        <div className="p-2">
                            {sortOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        setFilter("sortBy", option.value);
                                        setShowSort(false);
                                    }}
                                    className={`w-full px-4 py-3 text-left hover:bg-background-primary ${
                                        (filters.sortBy || "newest") ===
                                        option.value
                                            ? "font-semibold text-accent-1"
                                            : "text-text-primary"
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Shop;
