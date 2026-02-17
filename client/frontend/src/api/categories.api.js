import axiosInstance from "../utils/axios";
import logger from "../utils/logger.util";

const API_PREFIX = "/categories";

/**
 * Get all categories
 * @returns {Promise}
 */
export const getCategories = async () => {
    try {
        const response = await axiosInstance.get(API_PREFIX);
        logger.info("Categories fetched", {
            count: response.data?.categories?.length,
        });
        return response;
    } catch (error) {
        logger.error("Failed to fetch categories:", error);
        throw error;
    }
};

/**
 * Get category tree (hierarchical)
 * @returns {Promise}
 */
export const getCategoryTree = async () => {
    try {
        const response = await axiosInstance.get(`${API_PREFIX}/tree`);
        logger.info("Category tree fetched");
        return response;
    } catch (error) {
        logger.error("Failed to fetch category tree:", error);
        throw error;
    }
};

/**
 * Get category by slug
 * @param {string} slug - Category slug
 * @returns {Promise}
 */
export const getCategoryBySlug = async (slug) => {
    try {
        const response = await axiosInstance.get(`${API_PREFIX}/slug/${slug}`);
        logger.info("Category fetched by slug", { slug });
        return response;
    } catch (error) {
        logger.error("Failed to fetch category by slug:", error);
        throw error;
    }
};

/**
 * Get category by ID
 * @param {string} categoryId - Category ID
 * @returns {Promise}
 */
export const getCategoryById = async (categoryId) => {
    try {
        const response = await axiosInstance.get(`${API_PREFIX}/${categoryId}`);
        logger.info("Category fetched", { categoryId });
        return response;
    } catch (error) {
        logger.error("Failed to fetch category:", error);
        throw error;
    }
};
