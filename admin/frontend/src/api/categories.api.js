import axiosInstance from "../utils/axios";

/**
 * Get all categories (public)
 * @returns {Promise<Array>}
 */
export const getAllCategories = async () => {
    const response = await axiosInstance.get("/categories");
    return response.data;
};

/**
 * Get category tree structure (public)
 * @returns {Promise<Array>}
 */
export const getCategoryTree = async () => {
    const response = await axiosInstance.get("/categories/tree");
    return response.data;
};

/**
 * Get category by ID
 * @param {string} id - Category ID
 * @returns {Promise<Object>}
 */
export const getCategoryById = async (id) => {
    const response = await axiosInstance.get(`/categories/${id}`);
    return response.data;
};

/**
 * Get category by slug (public)
 * @param {string} slug - Category slug
 * @returns {Promise<Object>}
 */
export const getCategoryBySlug = async (slug) => {
    const response = await axiosInstance.get(`/categories/slug/${slug}`);
    return response.data;
};

/**
 * Create category
 * @param {FormData} formData - Category data with optional image
 * @returns {Promise<Object>}
 */
export const createCategory = async (formData) => {
    const response = await axiosInstance.post("/categories", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

/**
 * Update category
 * @param {string} id - Category ID
 * @param {FormData} formData - Updated category data
 * @returns {Promise<Object>}
 */
export const updateCategory = async (id, formData) => {
    const response = await axiosInstance.put(`/categories/${id}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

/**
 * Soft delete category
 * @param {string} id - Category ID
 * @returns {Promise<Object>}
 */
export const softDeleteCategory = async (id) => {
    const response = await axiosInstance.delete(`/categories/${id}`);
    return response.data;
};

/**
 * Hard delete category (permanent)
 * @param {string} id - Category ID
 * @returns {Promise<Object>}
 */
export const hardDeleteCategory = async (id) => {
    const response = await axiosInstance.delete(`/categories/${id}/force`);
    return response.data;
};
