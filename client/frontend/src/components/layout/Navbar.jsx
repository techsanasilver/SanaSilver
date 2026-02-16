import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
    FiSearch,
    FiHeart,
    FiShoppingBag,
    FiUser,
    FiChevronDown,
} from "react-icons/fi";
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
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [expandedSections, setExpandedSections] = useState([]);
    const userMenuRef = useRef(null);
    const searchRef = useRef(null);

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

    // Close menus on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(event.target)
            ) {
                setShowUserMenu(false);
            }
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target)
            ) {
                setShowSearchBar(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (showMobileMenu) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
            setShowMobileMenu(false);
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [showMobileMenu]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery("");
            setShowSearchBar(false);
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

    // Dropdown menu items
    const shopMenu = {
        title: "SHOP",
        items: categories.map((cat) => ({
            label: cat.name,
            link: `/shop?category=${cat.slug}`,
        })),
    };

    const infoMenu = {
        title: "INFO",
        items: [
            { label: "About Us", link: "/about" },
            { label: "Contact", link: "/contact" },
            { label: "FAQs", link: "/faqs" },
            { label: "Shipping & Returns", link: "/shipping" },
        ],
    };

    const quickLinksMenu = {
        title: "QUICK LINKS",
        items: [
            { label: "My Orders", link: "/orders" },
            { label: "My Wishlist", link: "/wishlist" },
            { label: "My Profile", link: "/profile" },
            { label: "Track Order", link: "/track-order" },
        ],
    };

    const toggleSection = (section) => {
        setExpandedSections((prev) =>
            prev.includes(section)
                ? prev.filter((s) => s !== section)
                : [...prev, section],
        );
    };

    const renderMobileSection = (menu) => {
        const isExpanded = expandedSections.includes(menu.title);

        return (
            <div key={menu.title} className="border-b border-divider">
                <button
                    onClick={() => toggleSection(menu.title)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                    <span className="text-sm font-medium text-text-primary uppercase tracking-wide">
                        {menu.title}
                    </span>
                    <FiChevronDown
                        className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                        }`}
                    />
                </button>
                {isExpanded && (
                    <div className="px-6 pb-4 space-y-2">
                        {menu.items.map((item, index) => (
                            <Link
                                key={index}
                                to={item.link}
                                className="block py-2 text-sm text-text-secondary hover:text-accent-2"
                                onClick={() => {
                                    setShowMobileMenu(false);
                                    setExpandedSections([]);
                                }}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderDropdownMenu = (menu) => {
        const isActive = activeDropdown === menu.title;

        return (
            <div
                className="relative group"
                onMouseEnter={() => setActiveDropdown(menu.title)}
                onMouseLeave={() => setActiveDropdown(null)}
            >
                <button className="px-4 py-2 text-sm font-medium text-text-primary hover:text-accent-2 transition-colors uppercase tracking-wider flex items-center gap-1">
                    {menu.title}
                    <FiChevronDown
                        className={`w-3 h-3 transition-transform duration-200 ${isActive ? "rotate-180" : ""}`}
                    />
                </button>

                {isActive && menu.items.length > 0 && (
                    <div className="absolute left-0 top-full mt-0 w-48 bg-background-primary border border-divider rounded-sm shadow-lg overflow-hidden z-50">
                        <div className="py-2">
                            {menu.items.map((item, index) => (
                                <Link
                                    key={index}
                                    to={item.link}
                                    className="block px-4 py-2.5 text-sm text-text-secondary hover:bg-background-secondary hover:text-text-primary"
                                    onClick={() => setActiveDropdown(null)}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <nav className="sticky top-0 z-50 bg-background-primary">
                {/* Desktop Navigation */}
                <div className="hidden lg:block">
                    <div className="container mx-auto px-6">
                        <div className="flex items-center justify-between h-16">
                            {/* Left: Logo */}
                            <div className="shrink-0">
                                <Link to="/" className="flex items-center">
                                    <span className="text-2xl font-light tracking-widest text-text-primary">
                                        SANA
                                    </span>
                                </Link>
                            </div>

                            {/* Center: Menus */}
                            <div className="flex items-center space-x-2">
                                {renderDropdownMenu(shopMenu)}
                                {renderDropdownMenu(infoMenu)}
                                {renderDropdownMenu(quickLinksMenu)}
                            </div>

                            {/* Right: Icons */}
                            <div className="flex items-center space-x-1">
                                {/* Search */}
                                <div className="relative" ref={searchRef}>
                                    {showSearchBar ? (
                                        <form
                                            onSubmit={handleSearch}
                                            className="flex items-center"
                                        >
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) =>
                                                    setSearchQuery(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Search..."
                                                className="w-64 px-4 py-1.5 pr-10 border border-neutral-300 rounded-sm focus:outline-none focus:border-neutral-400 text-sm"
                                                autoFocus
                                            />
                                            <button
                                                type="submit"
                                                className="absolute right-2 p-1.5 text-text-secondary hover:text-text-primary"
                                            >
                                                <FiSearch className="w-4 h-4" />
                                            </button>
                                        </form>
                                    ) : (
                                        <button
                                            onClick={() =>
                                                setShowSearchBar(true)
                                            }
                                            className="p-2.5 text-text-secondary hover:text-accent-2 transition-colors"
                                            aria-label="Search"
                                        >
                                            <FiSearch className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                {/* Wishlist */}
                                <Link
                                    to="/wishlist"
                                    className="relative p-2.5 text-text-secondary hover:text-accent-2 transition-colors"
                                    aria-label="Wishlist"
                                >
                                    <FiHeart className="w-5 h-5" />
                                    {wishlistCount > 0 && (
                                        <span className="absolute top-0 right-0 bg-accent-2 text-text-primary-invert text-xs font-medium rounded-full w-4 h-4 flex items-center justify-center">
                                            {wishlistCount}
                                        </span>
                                    )}
                                </Link>

                                {/* Cart */}
                                <Link
                                    to="/cart"
                                    className="relative p-2.5 text-text-secondary hover:text-accent-2 transition-colors"
                                    aria-label="Shopping Cart"
                                >
                                    <FiShoppingBag className="w-5 h-5" />
                                    {cartItemsCount > 0 && (
                                        <span className="absolute top-0 right-0 bg-accent-2 text-text-primary-invert text-xs font-medium rounded-full w-4 h-4 flex items-center justify-center">
                                            {cartItemsCount}
                                        </span>
                                    )}
                                </Link>

                                {/* User */}
                                <div className="relative" ref={userMenuRef}>
                                    {user ? (
                                        <>
                                            <button
                                                onClick={() =>
                                                    setShowUserMenu(
                                                        !showUserMenu,
                                                    )
                                                }
                                                className="p-2.5 text-text-secondary hover:text-accent-2 transition-colors"
                                                aria-label="User menu"
                                            >
                                                <FiUser className="w-5 h-5" />
                                            </button>

                                            {showUserMenu && (
                                                <div className="absolute right-0 mt-2 w-48 bg-background-primary border border-divider rounded-sm shadow-lg overflow-hidden">
                                                    <div className="py-2">
                                                        <Link
                                                            to="/profile"
                                                            className="block px-4 py-2.5 text-sm text-text-secondary hover:bg-background-secondary hover:text-text-primary"
                                                            onClick={() =>
                                                                setShowUserMenu(
                                                                    false,
                                                                )
                                                            }
                                                        >
                                                            My Profile
                                                        </Link>
                                                        <Link
                                                            to="/orders"
                                                            className="block px-4 py-2.5 text-sm text-text-secondary hover:bg-background-secondary hover:text-text-primary"
                                                            onClick={() =>
                                                                setShowUserMenu(
                                                                    false,
                                                                )
                                                            }
                                                        >
                                                            My Orders
                                                        </Link>
                                                        <hr className="my-1 border-divider" />
                                                        <button
                                                            onClick={
                                                                handleLogout
                                                            }
                                                            className="block w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:bg-background-secondary hover:text-text-primary"
                                                        >
                                                            Logout
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <Link
                                            to="/login"
                                            className="p-2.5 text-text-secondary hover:text-accent-2 transition-colors"
                                            aria-label="Login"
                                        >
                                            <FiUser className="w-5 h-5" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className="lg:hidden">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between h-16">
                            {/* Left: Hamburger Menu */}
                            <button
                                onClick={() =>
                                    setShowMobileMenu(!showMobileMenu)
                                }
                                className="p-2 text-text-primary"
                                aria-label="Toggle menu"
                            >
                                <div className="w-6 h-5 flex flex-col justify-between">
                                    <span
                                        className={`block h-0.5 w-full bg-current transform transition-all duration-300 origin-center ${
                                            showMobileMenu
                                                ? "rotate-45 translate-y-2.25"
                                                : ""
                                        }`}
                                    />
                                    <span
                                        className={`block h-0.5 w-full bg-current transition-all duration-300 ${
                                            showMobileMenu ? "opacity-0" : ""
                                        }`}
                                    />
                                    <span
                                        className={`block h-0.5 w-full bg-current transform transition-all duration-300 origin-center ${
                                            showMobileMenu
                                                ? "-rotate-45 -translate-y-2.25"
                                                : ""
                                        }`}
                                    />
                                </div>
                            </button>

                            {/* Center: Logo */}
                            <Link
                                to="/"
                                className="absolute left-1/2 -translate-x-1/2"
                            >
                                <span className="text-xl font-light tracking-widest text-text-primary">
                                    SANA
                                </span>
                            </Link>

                            {/* Right: Icons */}
                            {/* <div className="flex items-center space-x-1"> */}
                            <div className="flex items-center">
                                {/* Search */}
                                <button
                                    onClick={() =>
                                        setShowSearchBar(!showSearchBar)
                                    }
                                    className="p-2 text-text-secondary"
                                    aria-label="Search"
                                >
                                    <FiSearch className="w-5 h-5" />
                                </button>

                                {/* Wishlist */}
                                <Link
                                    to="/wishlist"
                                    className="relative p-2 text-text-secondary"
                                    aria-label="Wishlist"
                                >
                                    <FiHeart className="w-5 h-5" />
                                    {wishlistCount > 0 && (
                                        <span className="absolute top-0 right-0 bg-accent-2 text-text-primary-invert text-xs font-medium rounded-full w-4 h-4 flex items-center justify-center">
                                            {wishlistCount}
                                        </span>
                                    )}
                                </Link>

                                {/* Cart */}
                                <Link
                                    to="/cart"
                                    className="relative p-2 text-text-secondary"
                                    aria-label="Shopping Cart"
                                >
                                    <FiShoppingBag className="w-5 h-5" />
                                    {cartItemsCount > 0 && (
                                        <span className="absolute top-0 right-0 bg-accent-2 text-text-primary-invert text-xs font-medium rounded-full w-4 h-4 flex items-center justify-center">
                                            {cartItemsCount}
                                        </span>
                                    )}
                                </Link>
                            </div>
                        </div>

                        {/* Mobile Search Bar */}
                        {showSearchBar && (
                            <div className="pb-3">
                                <form onSubmit={handleSearch}>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        placeholder="Search..."
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-sm focus:outline-none focus:border-neutral-400 text-sm"
                                        autoFocus
                                    />
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <div
                className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
                    showMobileMenu
                        ? "opacity-100"
                        : "opacity-0 pointer-events-none"
                }`}
            >
                {/* Backdrop */}
                <div
                    className="absolute bg-black/50 backdrop-blur-lg inset-0 z-10"
                    onClick={() => setShowMobileMenu(false)}
                />

                {/* Menu Sidebar */}
                <div
                    className={`absolute left-0 top-0 h-full w-full bg-background-primary shadow-xl transform transition-transform duration-300 ease-out z-20 ${
                        showMobileMenu ? "translate-x-0" : "-translate-x-full"
                    }`}
                >
                    <div className="flex flex-col h-full pt-16">
                        {/* Menu Content */}
                        <div className="flex-1 overflow-y-auto">
                            {renderMobileSection(shopMenu)}
                            {renderMobileSection(infoMenu)}
                            {renderMobileSection(quickLinksMenu)}
                        </div>

                        {/* Login/Signup Button */}
                        <div className="p-6 border-t border-divider bg-background-primary">
                            {user ? (
                                <div className="space-y-2">
                                    <Link
                                        to="/profile"
                                        onClick={() => setShowMobileMenu(false)}
                                        className="block w-full py-3 text-center text-sm font-medium text-text-primary bg-background-primary border border-divider rounded-sm"
                                    >
                                        My Profile
                                    </Link>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setShowMobileMenu(false);
                                        }}
                                        className="block w-full py-3 text-center text-sm font-medium text-text-primary-invert bg-accent-2 rounded-sm"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    onClick={() => setShowMobileMenu(false)}
                                    className="flex items-center justify-center w-full py-3 text-sm font-medium text-text-primary-invert bg-background-invert hover:bg-background-invert/80 rounded-sm transition-colors"
                                >
                                    <FiUser className="w-4 h-4 mr-2" />
                                    Login/Signup
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Navbar;
