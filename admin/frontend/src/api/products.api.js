import axiosInstance from "../utils/axios";

/**
 * Get all products with filters and pagination
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 20)
 * @param {string} params.category - Category ID
 * @param {string} params.subcategory - Subcategory ID
 * @param {string} params.collections - Comma-separated collection names
 * @param {string} params.purity - "925" or "999"
 * @param {boolean} params.isFeatured - Filter by featured status
 * @param {boolean} params.isActive - Filter by active status
 * @param {string} params.gender - "men", "women", "unisex"
 * @param {string} params.gemstone - Gemstone type
 * @param {string} params.occasion - Occasion
 * @param {string} params.plating - Plating type
 * @param {number} params.minPrice - Minimum price
 * @param {number} params.maxPrice - Maximum price
 * @param {boolean} params.inStock - Filter by stock availability
 * @param {string} params.search - Full-text search query
 * @param {string} params.sortBy - Sort option (price-asc, price-desc, name-asc, name-desc, newest, oldest, rating, featured)
 * @param {Object} params.attributes - Variant attributes filter (e.g., {size: "7"})
 * @returns {Promise<{data: Array, pagination: Object}>}
 */
export const getAllProducts = async (params = {}) => {
    const response = await axiosInstance.get("/products", { params });
    return response.data;
};

/**
 * Get product by ID
 * @param {string} id - Product ID
 * @returns {Promise<Object>}
 */
export const getProductById = async (id) => {
    const response = await axiosInstance.get(`/products/${id}`);
    return response.data;
};

/**
 * Get product by slug
 * @param {string} slug - Product slug
 * @returns {Promise<Object>}
 */
export const getProductBySlug = async (slug) => {
    const response = await axiosInstance.get(`/products/slug/${slug}`);
    return response.data;
};

/**
 * Create product with variants
 * @param {FormData} formData - Product data with images
 * @returns {Promise<Object>}
 */
export const createProduct = async (formData) => {
    const response = await axiosInstance.post("/products", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

/**
 * Update product
 * @param {string} id - Product ID
 * @param {FormData} formData - Updated product data
 * @returns {Promise<Object>}
 */
export const updateProduct = async (id, formData) => {
    const response = await axiosInstance.put(`/products/${id}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

/**
 * Soft delete product (deactivate)
 * @param {string} id - Product ID
 * @returns {Promise<Object>}
 */
export const softDeleteProduct = async (id) => {
    const response = await axiosInstance.delete(`/products/${id}`);
    return response.data;
};

/**
 * Hard delete product (permanent)
 * @param {string} id - Product ID
 * @returns {Promise<Object>}
 */
export const hardDeleteProduct = async (id) => {
    const response = await axiosInstance.delete(`/products/${id}/force`);
    return response.data;
};

/**
 * Upload product images
 * @param {string} id - Product ID
 * @param {FormData} formData - Images to upload
 * @returns {Promise<Object>}
 */
export const uploadProductImages = async (id, formData) => {
    const response = await axiosInstance.post(
        `/products/${id}/images`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        },
    );
    return response.data;
};

/**
 * Delete product images
 * @param {string} id - Product ID
 * @param {Array<string>} publicIds - Image public IDs to delete
 * @returns {Promise<Object>}
 */
export const deleteProductImages = async (id, publicIds) => {
    const response = await axiosInstance.delete(`/products/${id}/images`, {
        data: { publicIds },
    });
    return response.data;
};

/**
 * Get all variants for a product
 * @param {string} productId - Product ID
 * @returns {Promise<Array>}
 */
export const getProductVariants = async (productId) => {
    const response = await axiosInstance.get(`/products/${productId}/variants`);
    return response.data;
};

/**
 * Create variant for a product
 * @param {string} productId - Product ID
 * @param {FormData} formData - Variant data with images
 * @returns {Promise<Object>}
 */
export const createVariant = async (productId, formData) => {
    const response = await axiosInstance.post(
        `/products/${productId}/variants`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        },
    );
    return response.data;
};

/**
 * Get variant by ID
 * @param {string} variantId - Variant ID
 * @returns {Promise<Object>}
 */
export const getVariantById = async (variantId) => {
    const response = await axiosInstance.get(`/products/variants/${variantId}`);
    return response.data;
};

/**
 * Update variant
 * @param {string} variantId - Variant ID
 * @param {FormData} formData - Updated variant data
 * @returns {Promise<Object>}
 */
export const updateVariant = async (variantId, formData) => {
    const response = await axiosInstance.put(
        `/products/variants/${variantId}`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        },
    );
    return response.data;
};

/**
 * Update variant stock
 * @param {string} variantId - Variant ID
 * @param {number} stockQuantity - New stock quantity
 * @returns {Promise<Object>}
 */
export const updateVariantStock = async (variantId, stockQuantity) => {
    const response = await axiosInstance.patch(
        `/products/variants/${variantId}/stock`,
        {
            stockQuantity,
        },
    );
    return response.data;
};

/**
 * Soft delete variant
 * @param {string} productId - Product ID
 * @param {string} variantId - Variant ID
 * @returns {Promise<Object>}
 */
export const softDeleteVariant = async (productId, variantId) => {
    const response = await axiosInstance.delete(
        `/products/${productId}/variants/${variantId}`,
    );
    return response.data;
};

/**
 * Hard delete variant (permanent)
 * @param {string} productId - Product ID
 * @param {string} variantId - Variant ID
 * @returns {Promise<Object>}
 */
export const hardDeleteVariant = async (productId, variantId) => {
    const response = await axiosInstance.delete(
        `/products/${productId}/variants/${variantId}/force`,
    );
    return response.data;
};

/**
 * Upload variant images
 * @param {string} variantId - Variant ID
 * @param {FormData} formData - Images to upload
 * @returns {Promise<Object>}
 */
export const uploadVariantImages = async (variantId, formData) => {
    const response = await axiosInstance.post(
        `/products/variants/${variantId}/images`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        },
    );
    return response.data;
};

/**
 * Delete variant images
 * @param {string} variantId - Variant ID
 * @param {Array<string>} publicIds - Image public IDs to delete
 * @returns {Promise<Object>}
 */
export const deleteVariantImages = async (variantId, publicIds) => {
    const response = await axiosInstance.delete(
        `/products/variants/${variantId}/images`,
        {
            data: { publicIds },
        },
    );
    return response.data;
};
