import axiosInstance from "../utils/axios";
import logger from "../utils/logger.util";

const API_PREFIX = "/collections";

/**
 * Get all collections with product counts
 * @returns {Promise}
 */
export const getCollections = async () => {
    try {
        const response = await axiosInstance.get(API_PREFIX);
        logger.info("Collections fetched", {
            count: response.data?.data?.length,
        });
        return response;
    } catch (error) {
        logger.error("Failed to fetch collections:", error);
        throw error;
    }
};

/**
 * Get collection details with sample products
 * @param {string} collectionName - Collection name
 * @param {number} limit - Number of sample products (default: 8)
 * @returns {Promise}
 */
export const getCollectionDetails = async (collectionName, limit = 8) => {
    try {
        const response = await axiosInstance.get(
            `${API_PREFIX}/${collectionName}`,
            {
                params: { limit },
            },
        );
        logger.info("Collection details fetched", { collectionName });
        return response;
    } catch (error) {
        logger.error("Failed to fetch collection details:", error);
        throw error;
    }
};
