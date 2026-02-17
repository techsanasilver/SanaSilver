/**
 * Image utility functions for handling responsive image URLs
 * All APIs return image objects with pre-generated URLs for different sizes
 */

/**
 * Available image sizes from backend:
 * - thumbnail: 200x200 (product cards, category icons)
 * - small: 400x400 (cart items, wishlist)
 * - medium: 800x800 (product detail main image)
 * - large: 1200x1200 (zoom/lightbox)
 * - original: Full size image
 */

const IMAGE_SIZES = {
    THUMBNAIL: "thumbnail",
    SMALL: "small",
    MEDIUM: "medium",
    LARGE: "large",
    ORIGINAL: "original",
};

const DEFAULT_PLACEHOLDER = "/placeholder.jpg";

/**
 * Get responsive image URL from image object
 * @param {Object} imageObj - Image object from API with urls property
 * @param {string} size - Size key (thumbnail|small|medium|large|original)
 * @param {string} fallback - Fallback image URL
 * @returns {string} Image URL
 *
 * @example
 * const url = getImageUrl(product.images[0], 'thumbnail');
 * const categoryUrl = getImageUrl(category.image, 'small', '/default-category.jpg');
 */
export const getImageUrl = (imageObj, size = "medium", fallback = null) => {
    // Return fallback if no image object
    if (!imageObj) {
        return fallback || DEFAULT_PLACEHOLDER;
    }

    // Priority 1: Check if urls object exists with requested size
    if (imageObj.urls && imageObj.urls[size]) {
        return imageObj.urls[size];
    }

    // Priority 2: Try to get original from urls
    if (imageObj.urls && imageObj.urls.original) {
        return imageObj.urls.original;
    }

    // Priority 3: Use direct url property
    if (imageObj.url) {
        return imageObj.url;
    }

    // Priority 4: Return fallback
    return fallback || DEFAULT_PLACEHOLDER;
};

/**
 * Get primary/first image from an array of images
 * @param {Array} images - Array of image objects
 * @param {string} size - Size to retrieve
 * @param {string} fallback - Fallback image URL
 * @returns {string} Image URL
 *
 * @example
 * const primaryImage = getPrimaryImageUrl(product.images, 'medium');
 */
export const getPrimaryImageUrl = (
    images,
    size = "medium",
    fallback = null,
) => {
    if (!images || !Array.isArray(images) || images.length === 0) {
        return fallback || DEFAULT_PLACEHOLDER;
    }

    // Find image marked as primary
    const primaryImage = images.find((img) => img.isPrimary);

    // Use primary or first image
    return getImageUrl(primaryImage || images[0], size, fallback);
};

/**
 * Get all image URLs for a product (for galleries)
 * @param {Array} images - Array of image objects
 * @param {string} size - Size to retrieve
 * @returns {Array} Array of image URLs
 *
 * @example
 * const galleryImages = getImageUrls(product.images, 'large');
 */
export const getImageUrls = (images, size = "medium") => {
    if (!images || !Array.isArray(images) || images.length === 0) {
        return [DEFAULT_PLACEHOLDER];
    }

    return images.map((img) => getImageUrl(img, size));
};

/**
 * Get srcset string for responsive images (advanced usage)
 * @param {Object} imageObj - Image object with urls
 * @returns {string} srcset string for img tag
 *
 * @example
 * <img src={getImageUrl(img, 'medium')} srcSet={getImageSrcSet(img)} />
 */
export const getImageSrcSet = (imageObj) => {
    if (!imageObj || !imageObj.urls) {
        return "";
    }

    const sizes = [];

    if (imageObj.urls.thumbnail) {
        sizes.push(`${imageObj.urls.thumbnail} 200w`);
    }
    if (imageObj.urls.small) {
        sizes.push(`${imageObj.urls.small} 400w`);
    }
    if (imageObj.urls.medium) {
        sizes.push(`${imageObj.urls.medium} 800w`);
    }
    if (imageObj.urls.large) {
        sizes.push(`${imageObj.urls.large} 1200w`);
    }

    return sizes.join(", ");
};

/**
 * Preload images for better UX
 * @param {string|Array} urls - Single URL or array of URLs
 */
export const preloadImages = (urls) => {
    const urlArray = Array.isArray(urls) ? urls : [urls];

    urlArray.forEach((url) => {
        if (url && url !== DEFAULT_PLACEHOLDER) {
            const img = new Image();
            img.src = url;
        }
    });
};

export { IMAGE_SIZES };
export default {
    getImageUrl,
    getPrimaryImageUrl,
    getImageUrls,
    getImageSrcSet,
    preloadImages,
    IMAGE_SIZES,
};
