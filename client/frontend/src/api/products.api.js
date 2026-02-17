import axiosInstance from "../utils/axios";
import logger from "../utils/logger.util";

const API_PREFIX = "/products";

/**
 * Get all products with pagination and filters
 * @param {object} params - Query parameters (page, limit, category, minPrice, maxPrice, sort, search)
 * @returns {Promise}
 */
export const getProducts = async (params = {}) => {
    try {
        const response = await axiosInstance.get(API_PREFIX, { params });
        logger.info("Products fetched", {
            count: response.data?.products?.length,
        });
        return response;
    } catch (error) {
        logger.error("Failed to fetch products:", error);
        throw error;
    }
};

/**
 * Get product by ID
 * @param {string} productId - Product ID
 * @returns {Promise}
 */
export const getProductById = async (productId) => {
    try {
        const response = await axiosInstance.get(`${API_PREFIX}/${productId}`);
        logger.info("Product fetched", { productId });
        return response;
    } catch (error) {
        logger.error("Failed to fetch product:", error);
        throw error;
    }
};

/**
 * Get product by slug
 * @param {string} slug - Product slug
 * @returns {Promise}
 */
export const getProductBySlug = async (slug) => {
    try {
        const response = await axiosInstance.get(`${API_PREFIX}/slug/${slug}`);
        logger.info("Product fetched by slug", { slug });
        return response;
    } catch (error) {
        logger.error("Failed to fetch product by slug:", error);
        throw error;
    }
};

/**
 * Get product variants
 * @param {string} productId - Product ID
 * @returns {Promise}
 */
export const getProductVariants = async (productId) => {
    try {
        const response = await axiosInstance.get(
            `${API_PREFIX}/${productId}/variants`,
        );
        logger.info("Product variants fetched", { productId });
        return response;
    } catch (error) {
        logger.error("Failed to fetch product variants:", error);
        throw error;
    }
};
