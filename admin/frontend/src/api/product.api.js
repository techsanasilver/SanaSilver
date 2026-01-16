/**
 * Products API
 * Handles all product-related API calls
 */

import axiosInstance from "../utils/axios";

/**
 * Get all products with pagination and filters
 */
export const getProducts = async (params = {}) => {
    const response = await axiosInstance.get("/products", { params });
    return response.data;
};

/**
 * Get single product by ID
 */
export const getProductById = async (productId) => {
    const response = await axiosInstance.get(`/products/${productId}`);
    return response.data;
};

/**
 * Create new product
 */
export const createProduct = async (productData) => {
    const response = await axiosInstance.post("/products", productData);
    return response.data;
};

/**
 * Update product
 */
export const updateProduct = async (productId, productData) => {
    const response = await axiosInstance.put(
        `/products/${productId}`,
        productData
    );
    return response.data;
};

/**
 * Delete product
 */
export const deleteProduct = async (productId) => {
    const response = await axiosInstance.delete(`/products/${productId}`);
    return response.data;
};

/**
 * Get product variants
 */
export const getProductVariants = async (productId) => {
    const response = await axiosInstance.get(`/products/${productId}/variants`);
    return response.data;
};

/**
 * Create product variant
 */
export const createVariant = async (productId, variantData) => {
    const response = await axiosInstance.post(
        `/products/${productId}/variants`,
        variantData
    );
    return response.data;
};

/**
 * Update product variant
 */
export const updateVariant = async (productId, variantId, variantData) => {
    const response = await axiosInstance.put(
        `/products/${productId}/variants/${variantId}`,
        variantData
    );
    return response.data;
};

/**
 * Delete product variant
 */
export const deleteVariant = async (productId, variantId) => {
    const response = await axiosInstance.delete(
        `/products/${productId}/variants/${variantId}`
    );
    return response.data;
};

/**
 * Upload product images
 */
export const uploadProductImages = async (productId, images) => {
    const formData = new FormData();
    images.forEach((image) => {
        formData.append("images", image);
    });

    const response = await axiosInstance.post(
        `/products/${productId}/images`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );
    return response.data;
};

/**
 * Delete product image
 */
export const deleteProductImage = async (productId, imageUrl) => {
    const response = await axiosInstance.delete(
        `/products/${productId}/images`,
        {
            data: { imageUrl },
        }
    );
    return response.data;
};

export default {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductVariants,
    createVariant,
    updateVariant,
    deleteVariant,
    uploadProductImages,
    deleteProductImage,
};
