import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { getCategoryTree } from "../../api/categories.api";
import logger from "../../utils/logger.util";

const Navbar = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { cart } = useCart();
    const { wishlistCount } = useWishlist();
    const [categories, setCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const userMenuRef = useRef(null);

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await getCategoryTree();
                setCategories(response.data?.categories || []);
            } catch (error) {
                logger.error("Failed to fetch categories:", error);
            }
        };
        fetchCategories();
    }, []);

    // Close user menu on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(event.target)
            ) {
                setShowUserMenu(false);
            }
        };

        if (showUserMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showUserMenu]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery("");
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/");
        } catch (error) {
            logger.error("Logout failed:", error);
        }
    };

    const cartItemsCount =
        cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;

    return (
        <nav className="sticky top-0 z-50 bg-white shadow-md">
            {/* Top Bar - Logo, Search, Actions */}
            <div className="border-b border-neutral-200">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="lg:hidden p-2 text-neutral-600 hover:text-primary"
                            aria-label="Toggle mobile menu"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                        </button>

                        {/* Logo */}
                        <Link to="/" className="flex items-center">
                            <span className="text-2xl font-bold text-primary">
                                Sana Silver
                            </span>
                        </Link>

                        {/* Search Bar - Desktop */}
                        <form
                            onSubmit={handleSearch}
                            className="hidden md:flex flex-1 max-w-xl mx-8"
                        >
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    placeholder="Search for silver jewelry..."
                                    className="w-full px-4 py-2 pr-10 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-neutral-500 hover:text-primary"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </form>

                        {/* Actions - Wishlist, Cart, User */}
                        <div className="flex items-center space-x-4">
                            {/* Wishlist */}
                            <Link
                                to="/wishlist"
                                className="relative p-2 text-neutral-600 hover:text-primary transition-colors"
                                aria-label="Wishlist"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                    />
                                </svg>
                                {wishlistCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {wishlistCount}
                                    </span>
                                )}
                            </Link>

                            {/* Cart */}
                            <Link
                                to="/cart"
                                className="relative p-2 text-neutral-600 hover:text-primary transition-colors"
                                aria-label="Shopping Cart"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                                {cartItemsCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {cartItemsCount}
                                    </span>
                                )}
                            </Link>

                            {/* User Menu */}
                            {user ? (
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() =>
                                            setShowUserMenu(!showUserMenu)
                                        }
                                        className="flex items-center space-x-2 p-2 text-neutral-600 hover:text-primary transition-colors"
                                    >
                                        <svg
                                            className="w-6 h-6"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                            />
                                        </svg>
                                        <span className="hidden md:inline text-sm font-medium">
                                            {user.name || user.phone}
                                        </span>
                                    </button>

                                    {showUserMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-neutral-200">
                                            <Link
                                                to="/profile"
                                                className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                                                onClick={() =>
                                                    setShowUserMenu(false)
                                                }
                                            >
                                                My Profile
                                            </Link>
                                            <Link
                                                to="/orders"
                                                className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                                                onClick={() =>
                                                    setShowUserMenu(false)
                                                }
                                            >
                                                My Orders
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
                                >
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Search Bar - Mobile */}
                    <form onSubmit={handleSearch} className="md:hidden pb-3">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search jewelry..."
                                className="w-full px-4 py-2 pr-10 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-neutral-500 hover:text-primary"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Category Navigation - Desktop */}
            <div className="hidden lg:block bg-neutral-50 border-b border-neutral-200">
                <div className="container mx-auto px-4">
                    <div className="flex items-center space-x-8 h-12 overflow-x-auto">
                        <Link
                            to="/shop"
                            className="text-sm font-medium text-neutral-700 hover:text-primary whitespace-nowrap transition-colors"
                        >
                            All Products
                        </Link>
                        {categories.map((category) => (
                            <Link
                                key={category._id}
                                to={`/shop?category=${category.slug}`}
                                className="text-sm font-medium text-neutral-700 hover:text-primary whitespace-nowrap transition-colors"
                            >
                                {category.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {showMobileMenu && (
                <div className="lg:hidden border-t border-neutral-200">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex flex-col space-y-2">
                            <Link
                                to="/shop"
                                className="py-2 px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
                                onClick={() => setShowMobileMenu(false)}
                            >
                                All Products
                            </Link>
                            {categories.map((category) => (
                                <Link
                                    key={category._id}
                                    to={`/shop?category=${category.slug}`}
                                    className="py-2 px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
                                    onClick={() => setShowMobileMenu(false)}
                                >
                                    {category.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
