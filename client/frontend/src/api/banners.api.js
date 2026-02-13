import axiosInstance from "../utils/axios";
import logger from "../utils/logger.util";

const API_PREFIX = "/client/banners";

/**
 * Get all banners
 * @returns {Promise}
 */
export const getAllBanners = async () => {
    try {
        const response = await axiosInstance.get(API_PREFIX);
        logger.info("Banners fetched", {
            count: response.data?.banners?.length,
        });
        return response;
    } catch (error) {
        logger.error("Failed to fetch banners:", error);
        throw error;
    }
};

/**
 * Get banner by ID
 * @param {string} bannerId - Banner ID
 * @returns {Promise}
 */
export const getBannerById = async (bannerId) => {
    try {
        const response = await axiosInstance.get(`${API_PREFIX}/${bannerId}`);
        logger.info("Banner fetched", { bannerId });
        return response;
    } catch (error) {
        logger.error("Failed to fetch banner:", error);
        throw error;
    }
};
