import axiosInstance from "../utils/axios";

/**
 * Get all banners with optional filters
 * @param {Object} params - Query parameters
 * @param {boolean} params.isActive - Filter by active status
 * @param {string} params.displayLocation - Filter by display location (home/shop/about/contact/all)
 * @param {boolean} params.scheduled - Filter by scheduled status
 * @returns {Promise<{count: number, banners: Array}>}
 */
export const getAllBanners = async (params = {}) => {
    const response = await axiosInstance.get("/banners", { params });
    return response.data;
};

/**
 * Get banner by ID
 * @param {string} id - Banner ID
 * @returns {Promise<Object>}
 */
export const getBannerById = async (id) => {
    const response = await axiosInstance.get(`/banners/${id}`);
    return response.data;
};

/**
 * Create new banner with images
 * @param {FormData} formData - Banner data with desktop and optional mobile image
 * @returns {Promise<Object>}
 */
export const createBanner = async (formData) => {
    const response = await axiosInstance.post("/banners", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

/**
 * Update banner
 * @param {string} id - Banner ID
 * @param {FormData} formData - Updated banner data with optional images
 * @returns {Promise<Object>}
 */
export const updateBanner = async (id, formData) => {
    const response = await axiosInstance.put(`/banners/${id}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

/**
 * Soft delete banner (deactivate)
 * @param {string} id - Banner ID
 * @returns {Promise<Object>}
 */
export const softDeleteBanner = async (id) => {
    const response = await axiosInstance.delete(`/banners/${id}`);
    return response.data;
};

/**
 * Hard delete banner permanently
 * @param {string} id - Banner ID
 * @returns {Promise<Object>}
 */
export const hardDeleteBanner = async (id) => {
    const response = await axiosInstance.delete(`/banners/${id}/force`);
    return response.data;
};

/**
 * Update banner status (toggle isActive)
 * @param {string} id - Banner ID
 * @param {boolean} isActive - New active status
 * @returns {Promise<Object>}
 */
export const updateBannerStatus = async (id, isActive) => {
    const response = await axiosInstance.patch(`/banners/${id}/status`, {
        isActive,
    });
    return response.data;
};

/**
 * Reorder banners (bulk update sort orders)
 * @param {Array} orders - Array of {id, sortOrder}
 * @returns {Promise<Object>}
 */
export const reorderBanners = async (orders) => {
    const response = await axiosInstance.post("/banners/reorder", { orders });
    return response.data;
};
