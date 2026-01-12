import Banner from "./banner.model.js";
import {
    uploadSingleImage,
    deleteImage,
    getImageVariants,
} from "../../shared/utils/cloudinary.util.js";

/**
 * Create a new banner with desktop and optional mobile image
 */
const createBanner = async (bannerData, files) => {
    try {
        // Validate that we have at least desktop image
        if (!files || files.length < 1) {
            throw new Error("Desktop image is required");
        }

        // Upload desktop image (first file)
        const desktopImageResult = await uploadSingleImage(
            files[0].buffer,
            "banners",
            `banner_${Date.now()}_desktop`
        );

        // Prepare banner data with desktop image
        const bannerDataWithImages = {
            ...bannerData,
            desktopImage: {
                publicId: desktopImageResult.publicId,
                url: desktopImageResult.secureUrl,
                alt: bannerData.title || "",
                urls: getImageVariants(desktopImageResult.publicId),
            },
        };

        // Upload mobile image if provided (second file)
        if (files.length > 1) {
            const mobileImageResult = await uploadSingleImage(
                files[1].buffer,
                "banners",
                `banner_${Date.now()}_mobile`
            );

            bannerDataWithImages.mobileImage = {
                publicId: mobileImageResult.publicId,
                url: mobileImageResult.secureUrl,
                alt: bannerData.title || "",
                urls: getImageVariants(mobileImageResult.publicId),
            };
        }

        // Create banner with images
        const banner = new Banner(bannerDataWithImages);

        await banner.save();
        return banner;
    } catch (error) {
        throw error;
    }
};

/**
 * Get all banners with optional filtering
 */
const getAllBanners = async (filters = {}) => {
    try {
        const query = {};

        // Filter by active status
        if (filters.isActive !== undefined) {
            query.isActive =
                filters.isActive === "true" || filters.isActive === true;
        }

        // Filter by display location
        if (filters.displayLocation) {
            query.displayLocation = filters.displayLocation;
        }

        // Date range filtering (currently scheduled)
        if (filters.scheduled === "true" || filters.scheduled === true) {
            const now = new Date();
            query.$or = [
                { startDate: { $exists: false }, endDate: { $exists: false } },
                { startDate: { $lte: now }, endDate: { $gte: now } },
                { startDate: { $lte: now }, endDate: { $exists: false } },
                { startDate: { $exists: false }, endDate: { $gte: now } },
            ];
        }

        const banners = await Banner.find(query).sort({
            sortOrder: 1,
            createdAt: -1,
        });
        return banners;
    } catch (error) {
        throw error;
    }
};

/**
 * Get a single banner by ID
 */
const getBannerById = async (bannerId) => {
    try {
        const banner = await Banner.findById(bannerId);
        if (!banner) {
            throw new Error("Banner not found");
        }
        return banner;
    } catch (error) {
        throw error;
    }
};

/**
 * Update a banner with optional image updates
 */
const updateBanner = async (bannerId, updateData, files = undefined) => {
    try {
        const banner = await Banner.findById(bannerId);
        if (!banner) {
            throw new Error("Banner not found");
        }

        // Track images to delete
        const imagesToDelete = [];

        // Handle desktop image update
        if (files && files.length > 0) {
            // Upload new desktop image
            const desktopImageResult = await uploadSingleImage(
                files[0].buffer,
                "banners",
                `banner_${Date.now()}_desktop`
            );

            // Mark old desktop image for deletion
            if (banner.desktopImage?.publicId) {
                imagesToDelete.push(banner.desktopImage.publicId);
            }

            // Update desktop image
            updateData.desktopImage = {
                publicId: desktopImageResult.publicId,
                url: desktopImageResult.secureUrl,
                alt: updateData.title || banner.title || "",
                urls: getImageVariants(desktopImageResult.publicId),
            };
        } else if (updateData.deleteDesktopImage) {
            throw new Error(
                "Cannot delete desktop image without uploading a replacement"
            );
        }

        // Handle mobile image update
        if (files && files.length > 1) {
            // Upload new mobile image
            const mobileImageResult = await uploadSingleImage(
                files[1].buffer,
                "banners",
                `banner_${Date.now()}_mobile`
            );

            // Mark old mobile image for deletion
            if (banner.mobileImage?.publicId) {
                imagesToDelete.push(banner.mobileImage.publicId);
            }

            // Update mobile image
            updateData.mobileImage = {
                publicId: mobileImageResult.publicId,
                url: mobileImageResult.secureUrl,
                alt: updateData.title || banner.title || "",
                urls: getImageVariants(mobileImageResult.publicId),
            };
        } else if (updateData.deleteMobileImage) {
            throw new Error(
                "Cannot delete mobile image without uploading a replacement"
            );
        }

        // Clean up flags
        delete updateData.deleteDesktopImage;
        delete updateData.deleteMobileImage;

        // Update banner
        Object.assign(banner, updateData);
        await banner.save();

        // Delete old images from Cloudinary
        if (imagesToDelete.length > 0) {
            await Promise.all(
                imagesToDelete.map((publicId) => deleteImage(publicId))
            );
        }

        return banner;
    } catch (error) {
        throw error;
    }
};

/**
 * Soft delete a banner (deactivate)
 */
const softDeleteBanner = async (bannerId) => {
    try {
        const banner = await Banner.findByIdAndUpdate(
            bannerId,
            { isActive: false },
            { new: true, runValidators: true }
        );

        if (!banner) {
            throw new Error("Banner not found");
        }

        return { message: "Banner deactivated successfully", banner };
    } catch (error) {
        throw error;
    }
};

/**
 * Hard delete a banner and its images (permanent)
 */
const hardDeleteBanner = async (bannerId) => {
    try {
        const banner = await Banner.findById(bannerId);
        if (!banner) {
            throw new Error("Banner not found");
        }

        // Collect image public IDs to delete
        const imagesToDelete = [];
        if (banner.desktopImage?.publicId) {
            imagesToDelete.push(banner.desktopImage.publicId);
        }
        if (banner.mobileImage?.publicId) {
            imagesToDelete.push(banner.mobileImage.publicId);
        }

        // Delete banner from database
        await Banner.findByIdAndDelete(bannerId);

        // Delete images from Cloudinary
        if (imagesToDelete.length > 0) {
            await Promise.all(
                imagesToDelete.map((publicId) => deleteImage(publicId))
            );
        }

        return { message: "Banner permanently deleted successfully" };
    } catch (error) {
        throw error;
    }
};

/**
 * Update banner active status
 */
const updateBannerStatus = async (bannerId, isActive) => {
    try {
        const banner = await Banner.findByIdAndUpdate(
            bannerId,
            { isActive },
            { new: true, runValidators: true }
        );

        if (!banner) {
            throw new Error("Banner not found");
        }

        return banner;
    } catch (error) {
        throw error;
    }
};

/**
 * Reorder banners (bulk update sort orders)
 */
const reorderBanners = async (orderUpdates) => {
    try {
        const updatePromises = orderUpdates.map(({ id, sortOrder }) =>
            Banner.findByIdAndUpdate(id, { sortOrder }, { new: true })
        );

        await Promise.all(updatePromises);
        return { message: "Banners reordered successfully" };
    } catch (error) {
        throw error;
    }
};

export {
    createBanner,
    getAllBanners,
    getBannerById,
    updateBanner,
    softDeleteBanner,
    hardDeleteBanner,
    updateBannerStatus,
    reorderBanners,
};
