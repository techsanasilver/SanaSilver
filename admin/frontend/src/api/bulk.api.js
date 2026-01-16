/**
 * Bulk Operations API
 * Handles bulk import/export operations for products
 */

import axiosInstance from "../utils/axios";

/**
 * Export products to Excel
 * @param {Object} filters - Optional filters for export
 * @returns {Blob} Excel file blob
 */
export const exportProducts = async (filters = {}) => {
    const response = await axiosInstance.post(
        "/bulk-operations/export",
        filters,
        {
            responseType: "blob", // Important: tells axios to expect binary data
        }
    );

    // Return blob for download
    return response.data;
};

/**
 * Download exported file
 * Helper function to trigger file download in browser
 */
export const downloadExportedFile = (
    blob,
    filename = "products-export.xlsx"
) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

/**
 * Import products from Excel
 * @param {File} file - Excel file to import
 * @returns {Promise} Import result
 */
export const importProducts = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosInstance.post(
        "/bulk-operations/import",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
            timeout: 120000, // 2 minutes timeout for large imports
        }
    );

    return response.data;
};

/**
 * Get bulk operation status
 * @param {string} operationId - The operation ID to check
 * @returns {Promise} Operation status
 */
export const getBulkOperationStatus = async (operationId) => {
    const response = await axiosInstance.get(
        `/bulk-operations/status/${operationId}`
    );
    return response.data;
};

/**
 * Get bulk operation history
 * @param {Object} params - Query parameters (page, limit, etc.)
 * @returns {Promise} Operation history
 */
export const getBulkOperationHistory = async (params = {}) => {
    const response = await axiosInstance.get("/bulk-operations/history", {
        params,
    });
    return response.data;
};

/**
 * Download template Excel file
 * @returns {Blob} Template file blob
 */
export const downloadTemplate = async () => {
    const response = await axiosInstance.get("/bulk-operations/template", {
        responseType: "blob",
    });
    return response.data;
};

export default {
    exportProducts,
    downloadExportedFile,
    importProducts,
    getBulkOperationStatus,
    getBulkOperationHistory,
    downloadTemplate,
};
