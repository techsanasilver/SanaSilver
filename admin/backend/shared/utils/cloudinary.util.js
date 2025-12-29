import cloudinary from "../config/cloudinary.config.js";
import streamifier from "streamifier";
import logger from "./logger.util.js";

/**
 * Upload a single image to Cloudinary
 * @param {Buffer} buffer - Image buffer from multer
 * @param {string} folder - Cloudinary folder path (e.g., 'products', 'categories', 'admins')
 * @param {string} publicId - Optional custom public_id for the image
 * @returns {Promise<Object>} Upload result with url, publicId, etc.
 *
 * Example:
 * const result = await uploadSingleImage(buffer, 'products', 'prod_123_img1');
 * Returns: { publicId: 'sana-silver/products/prod_123_img1', url: '...', secureUrl: '...' }
 */
export const uploadSingleImage = async (buffer, folder, publicId = null) => {
    try {
        // Generate unique public_id if not provided
        const imagePublicId =
            publicId ||
            `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `sana-silver/${folder}`,
                    public_id: imagePublicId,
                    resource_type: "image",

                    // Optimizations
                    transformation: [
                        {
                            width: 1200,
                            height: 1200,
                            crop: "limit", // Don't upscale, only downscale if larger
                        },
                    ],
                    quality: "auto", // Cloudinary picks best quality
                    fetch_format: "auto", // Auto-convert to WebP for supported browsers
                    strip_profile: true, // Remove EXIF metadata
                },
                (error, result) => {
                    if (error) {
                        logger.error("Cloudinary upload error:", error);
                        reject(
                            new Error(`Image upload failed: ${error.message}`)
                        );
                    } else {
                        logger.info(
                            `Image uploaded successfully: ${result.public_id}`
                        );
                        resolve({
                            publicId: result.public_id,
                            url: result.url,
                            secureUrl: result.secure_url,
                            width: result.width,
                            height: result.height,
                            format: result.format,
                            bytes: result.bytes,
                        });
                    }
                }
            );

            // Convert buffer to stream and pipe to Cloudinary
            streamifier.createReadStream(buffer).pipe(uploadStream);
        });
    } catch (error) {
        logger.error("Upload single image error:", error);
        throw new Error(`Failed to upload image: ${error.message}`);
    }
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array<Buffer>} buffers - Array of image buffers from multer
 * @param {string} folder - Cloudinary folder path
 * @param {string} prefix - Optional prefix for public_ids (e.g., 'prod_123')
 * @returns {Promise<Array<Object>>} Array of upload results
 *
 * Example:
 * const results = await uploadMultipleImages([buffer1, buffer2], 'products', 'prod_123');
 * Returns: [
 *   { publicId: 'sana-silver/products/prod_123_img1', url: '...' },
 *   { publicId: 'sana-silver/products/prod_123_img2', url: '...' }
 * ]
 */
export const uploadMultipleImages = async (buffers, folder, prefix = null) => {
    try {
        if (!Array.isArray(buffers) || buffers.length === 0) {
            throw new Error("No image buffers provided");
        }

        // Upload all images in parallel
        const uploadPromises = buffers.map((buffer, index) => {
            const publicId = prefix
                ? `${prefix}_img${index + 1}`
                : `img_${Date.now()}_${index + 1}`;

            return uploadSingleImage(buffer, folder, publicId);
        });

        const results = await Promise.all(uploadPromises);

        logger.info(
            `Successfully uploaded ${results.length} images to ${folder}`
        );

        return results;
    } catch (error) {
        logger.error("Upload multiple images error:", error);
        throw new Error(`Failed to upload images: ${error.message}`);
    }
};

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - Full public_id of the image (e.g., 'sana-silver/products/prod_123_img1')
 * @returns {Promise<boolean>} Success status
 *
 * Example:
 * await deleteImage('sana-silver/products/prod_123_img1');
 */
export const deleteImage = async (publicId) => {
    try {
        if (!publicId) {
            throw new Error("Public ID is required");
        }

        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: "image",
        });

        if (result.result === "ok" || result.result === "not found") {
            logger.info(`Image deleted successfully: ${publicId}`);
            return true;
        } else {
            logger.error(`Failed to delete image: ${publicId}`, result);
            return false;
        }
    } catch (error) {
        logger.error("Delete image error:", error);
        throw new Error(`Failed to delete image: ${error.message}`);
    }
};

/**
 * Delete multiple images from Cloudinary
 * @param {Array<string>} publicIds - Array of public_ids
 * @returns {Promise<Object>} Object with success and failed arrays
 *
 * Example:
 * const result = await deleteMultipleImages(['sana-silver/products/prod_123_img1', 'sana-silver/products/prod_123_img2']);
 * Returns: { success: ['prod_123_img1'], failed: [] }
 */
export const deleteMultipleImages = async (publicIds) => {
    try {
        if (!Array.isArray(publicIds) || publicIds.length === 0) {
            throw new Error("No public IDs provided");
        }

        const results = {
            success: [],
            failed: [],
        };

        // Delete images in parallel
        const deletePromises = publicIds.map(async (publicId) => {
            try {
                const success = await deleteImage(publicId);
                if (success) {
                    results.success.push(publicId);
                } else {
                    results.failed.push(publicId);
                }
            } catch (error) {
                results.failed.push(publicId);
            }
        });

        await Promise.all(deletePromises);

        logger.info(
            `Deleted ${results.success.length} images, ${results.failed.length} failed`
        );

        return results;
    } catch (error) {
        logger.error("Delete multiple images error:", error);
        throw new Error(`Failed to delete images: ${error.message}`);
    }
};

/**
 * Generate responsive image URLs with different sizes
 * All variants maintain original aspect ratio - NO CROPPING
 * Use CSS on frontend to handle display (object-fit: cover/contain)
 *
 * @param {string} publicId - Cloudinary public_id (e.g., 'sana-silver/products/prod_123_img1')
 * @returns {Object} Object with different sized URLs
 *
 * Example:
 * const urls = getImageVariants('sana-silver/products/prod_123_img1');
 * Returns: { thumbnail: '...', small: '...', medium: '...', large: '...', original: '...' }
 */
export const getImageVariants = (publicId) => {
    if (!publicId) {
        return null;
    }

    const baseUrl = cloudinary.url(publicId, {
        secure: true,
    });

    return {
        // Thumbnail for listing pages (max 200x200, maintains aspect ratio)
        // Example: 1920x1080 image → 200x112 (preserves 16:9)
        thumbnail: cloudinary.url(publicId, {
            secure: true,
            transformation: [
                {
                    width: 200,
                    height: 200,
                    crop: "limit", // ✅ Fits within 200x200, NO cropping
                },
                { quality: "auto" },
                { fetch_format: "auto" },
            ],
        }),

        // Small for cart/checkout (max 400x400, maintains aspect ratio)
        small: cloudinary.url(publicId, {
            secure: true,
            transformation: [
                {
                    width: 400,
                    height: 400,
                    crop: "limit", // ✅ Fits within 400x400, NO cropping
                },
                { quality: "auto" },
                { fetch_format: "auto" },
            ],
        }),

        // Medium for product detail page (max 800x800, maintains aspect ratio)
        medium: cloudinary.url(publicId, {
            secure: true,
            transformation: [
                {
                    width: 800,
                    height: 800,
                    crop: "limit", // ✅ Fits within 800x800, NO cropping
                },
                { quality: "auto" },
                { fetch_format: "auto" },
            ],
        }),

        // Large for zoom/lightbox (max 1200x1200, maintains aspect ratio)
        large: cloudinary.url(publicId, {
            secure: true,
            transformation: [
                {
                    width: 1200,
                    height: 1200,
                    crop: "limit", // ✅ Fits within 1200x1200, NO cropping
                },
                { quality: "auto" },
                { fetch_format: "auto" },
            ],
        }),

        // Original stored image
        original: baseUrl,
    };
};

/**
 * Generate square thumbnail (for avatars, icons where square is needed)
 * This WILL crop to square - use only when necessary
 *
 * @param {string} publicId - Cloudinary public_id
 * @param {number} size - Square size (default: 200)
 * @returns {string} Square cropped image URL
 *
 * Example:
 * const avatarUrl = getSquareThumbnail('sana-silver/admins/admin_123', 150);
 */
export const getSquareThumbnail = (publicId, size = 200) => {
    if (!publicId) {
        return null;
    }

    return cloudinary.url(publicId, {
        secure: true,
        transformation: [
            {
                width: size,
                height: size,
                crop: "fill", // ⚠️ Crops to fill square
                gravity: "auto", // Smart crop (focuses on main subject)
            },
            { quality: "auto" },
            { fetch_format: "auto" },
        ],
    });
};

/**
 * Generate a custom transformation URL
 * @param {string} publicId - Cloudinary public_id
 * @param {Object} options - Transformation options
 * @returns {string} Transformed image URL
 *
 * Example:
 * const url = getCustomTransformation('sana-silver/products/prod_123_img1', {
 *     width: 500,
 *     height: 500,
 *     crop: 'fill',
 *     quality: 80
 * });
 */
export const getCustomTransformation = (publicId, options = {}) => {
    if (!publicId) {
        return null;
    }

    return cloudinary.url(publicId, {
        secure: true,
        transformation: [options],
    });
};

/**
 * Delete images from folder (bulk delete)
 * @param {string} folderPath - Folder path in Cloudinary
 * @returns {Promise<Object>} Deletion result
 *
 * Example:
 * await deleteFolder('sana-silver/products/prod_123');
 */
export const deleteFolder = async (folderPath) => {
    try {
        // Delete all resources in folder
        const result = await cloudinary.api.delete_resources_by_prefix(
            folderPath,
            { resource_type: "image" }
        );

        logger.info(`Folder deleted: ${folderPath}`);
        return result;
    } catch (error) {
        logger.error("Delete folder error:", error);
        throw new Error(`Failed to delete folder: ${error.message}`);
    }
};

export default {
    uploadSingleImage,
    uploadMultipleImages,
    deleteImage,
    deleteMultipleImages,
    getImageVariants,
    getSquareThumbnail,
    getCustomTransformation,
    deleteFolder,
};
