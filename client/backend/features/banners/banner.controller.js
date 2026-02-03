import * as bannerService from "./banner.service.js";
import apiResponse from "../../shared/utils/response.util.js";

const getAllBanners = async (req, res) => {
    try {
        const { isActive, displayLocation, scheduled } = req.query;

        const filters = {};
        if (isActive !== undefined) filters.isActive = isActive;
        if (displayLocation) filters.displayLocation = displayLocation;
        if (scheduled !== undefined) filters.scheduled = scheduled;

        const banners = await bannerService.getAllBanners(filters);

        return apiResponse.success(res, "Banners fetched successfully", {
            count: banners.length,
            banners,
        });
    } catch (error) {
        console.error("Error fetching banners:", error);
        return apiResponse.serverError(
            res,
            error.message || "Failed to fetch banners",
        );
    }
};

const getBannerById = async (req, res) => {
    try {
        const banner = await bannerService.getBannerById(req.params.id);
        return apiResponse.success(res, "Banner fetched successfully", banner);
    } catch (error) {
        console.error("Error fetching banner:", error);
        if (error.message === "Banner not found") {
            return apiResponse.notFound(res, error.message);
        }
        return apiResponse.serverError(
            res,
            error.message || "Failed to fetch banner",
        );
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
