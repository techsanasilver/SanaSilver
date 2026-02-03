import Banner from "./banner.model.js";

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
