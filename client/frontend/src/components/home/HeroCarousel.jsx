import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getAllBanners } from "../../api/banners.api";
import { getImageUrl } from "../../utils/image.util";
import logger from "../../utils/logger.util";

const HeroCarousel = () => {
    const [banners, setBanners] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Auto-slide interval (5 seconds)
    const SLIDE_INTERVAL = 5000;

    // Detect mobile screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Fetch banners
    useEffect(() => {
        const fetchBanners = async () => {
            try {
                setLoading(true);
                const response = await getAllBanners();

                // API response structure: response.data.data.banners
                const bannerData = response.data?.data?.banners || [];

                // Filter active banners for home page
                const activeBanners = bannerData.filter(
                    (banner) =>
                        banner.isActive &&
                        (banner.displayLocation === "home" ||
                            banner.displayLocation === "all"),
                );

                // Sort by sortOrder
                activeBanners.sort((a, b) => a.sortOrder - b.sortOrder);

                setBanners(activeBanners);
                logger.info(
                    `Loaded ${activeBanners.length} banners for home page`,
                );
            } catch (error) {
                logger.error("Failed to fetch banners:", error);
                setBanners([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBanners();
    }, []);

    // Auto-slide functionality
    useEffect(() => {
        if (banners.length <= 1 || isPaused) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, SLIDE_INTERVAL);

        return () => clearInterval(interval);
    }, [banners.length, isPaused]);

    // Navigate to specific slide
    const goToSlide = useCallback((index) => {
        setCurrentIndex(index);
    }, []);

    // Get responsive image based on screen size
    const getBannerImage = (banner) => {
        // Use mobile image if available and on mobile screen
        if (isMobile && banner.mobileImage?.urls) {
            return getImageUrl(banner.mobileImage, "original");
        }
        // Use desktop image
        return getImageUrl(banner.desktopImage, "original");
    };

    // Get banner alt text
    const getBannerAlt = (banner) => {
        if (isMobile && banner.mobileImage?.alt) {
            return banner.mobileImage.alt;
        }
        return banner.desktopImage?.alt || banner.title;
    };

    // Render link wrapper (internal or external)
    const BannerLink = ({ banner, children }) => {
        if (!banner.link?.url) {
            return <div className="relative w-full h-full">{children}</div>;
        }

        if (banner.link.type === "external") {
            return (
                <a
                    href={banner.link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-full h-full block"
                >
                    {children}
                </a>
            );
        }

        return (
            <Link to={banner.link.url} className="relative w-full h-full block">
                {children}
            </Link>
        );
    };

    if (loading) {
        return (
            <div className="w-full bg-background-secondary animate-pulse">
                <div className="w-full h-64 md:h-96" />
            </div>
        );
    }

    if (banners.length === 0) {
        return null;
    }

    return (
        <div>
            <div
                className="relative w-full bg-background-secondary overflow-hidden"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {/* Banners */}
                <div className="relative w-full">
                    {banners.map((banner, index) => (
                        <div
                            key={banner._id}
                            className={`transition-opacity duration-700 ease-in-out ${
                                index === currentIndex
                                    ? "opacity-100 relative"
                                    : "opacity-0 absolute inset-0 pointer-events-none"
                            }`}
                        >
                            <BannerLink banner={banner}>
                                <div className="relative w-full">
                                    {/* Banner Image */}
                                    <img
                                        src={getBannerImage(banner)}
                                        alt={getBannerAlt(banner)}
                                        className="w-full h-auto block"
                                        loading={index === 0 ? "eager" : "lazy"}
                                    />

                                    {/* Banner Content Overlay */}
                                    {(banner.title ||
                                        banner.subtitle ||
                                        banner.buttonText) && (
                                        <div className="absolute inset-0 bg-linear-to-r from-black/50 to-transparent flex items-center">
                                            <div className="px-4 md:px-8 lg:px-16">
                                                <div className="max-w-2xl text-white">
                                                    {banner.title && (
                                                        <h1 className="text-xl md:text-5xl lg:text-6xl font-bold mb-2 md:mb-4 tracking-wide">
                                                            {banner.title}
                                                        </h1>
                                                    )}
                                                    {banner.subtitle && (
                                                        <p className="text-sm md:text-xl lg:text-2xl mb-3 md:mb-6 font-light">
                                                            {banner.subtitle}
                                                        </p>
                                                    )}
                                                    {banner.buttonText &&
                                                        banner.link?.url && (
                                                            <button className="px-6 py-2 md:px-8 md:py-3 text-sm md:text-base bg-accent-1 text-text-primary-invert font-medium rounded-md hover:bg-accent-1/90 transition-colors shadow-lg">
                                                                {
                                                                    banner.buttonText
                                                                }
                                                            </button>
                                                        )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </BannerLink>
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Dots (Desktop Only) - Below Banner */}
            {!isMobile && banners.length > 1 && (
                <div className="py-6 bg-background-primary">
                    <div className="flex justify-center gap-3">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`transition-all duration-300 rounded-full ${
                                    index === currentIndex
                                        ? "w-10 h-3 bg-accent-1"
                                        : "w-3 h-3 bg-text-secondary/30 hover:bg-accent-1/50"
                                }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeroCarousel;
