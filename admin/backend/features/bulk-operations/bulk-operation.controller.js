import {
    exportProductsService,
    importProductsService,
    generateTemplateService,
    getBulkOperation,
    listBulkOperations,
} from "./bulk-operation.service.js";
import apiResponse from "../../shared/utils/response.util.js";
import logger from "../../shared/utils/logger.util.js";

/**
 * Export products
 * POST /api/admin/bulk-operations/export
 */
export const exportProductsController = async (req, res) => {
    try {
        const filters = req.body;
        const performedBy = req.admin._id;

        const { buffer, filename } = await exportProductsService(
            filters,
            performedBy
        );

        // Send file directly as download (stream buffer, no filesystem storage)
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`
        );
        res.setHeader("Content-Length", buffer.length);

        return res.send(buffer);
    } catch (error) {
        logger.error("Export controller error:", error);
        return apiResponse.serverError(res, error.message);
    }
};

/**
 * Import products
 * POST /api/admin/bulk-operations/import
 */
export const importProductsController = async (req, res) => {
    try {
        if (!req.file) {
            return apiResponse.badRequest(res, "No file uploaded");
        }

        const fileBuffer = req.file.buffer;
        const fileName = req.file.originalname;
        const fileSize = req.file.size;
        const performedBy = req.admin._id;

        const operation = await importProductsService(
            fileBuffer,
            fileName,
            fileSize,
            performedBy
        );

        if (operation.status === "failed") {
            return apiResponse.validationError(
                res,
                "Import validation failed",
                {
                    operationId: operation._id,
                    status: operation.status,
                    errors: operation.errors,
                    warnings: operation.warnings,
                    stats: operation.stats,
                }
            );
        }

        return apiResponse.success(res, "Import completed successfully", {
            operationId: operation._id,
            status: operation.status,
            stats: operation.stats,
            warnings: operation.warnings,
            duration: operation.duration,
        });
    } catch (error) {
        logger.error("Import controller error:", error);
        return apiResponse.serverError(res, error.message);
    }
};

/**
 * Download template
 * GET /api/admin/bulk-operations/template
 */
export const downloadTemplateController = async (req, res) => {
    try {
        const { buffer, filename } = await generateTemplateService();

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`
        );
        res.setHeader("Content-Length", buffer.length);

        return res.send(buffer);
    } catch (error) {
        logger.error("Template controller error:", error);
        return apiResponse.serverError(res, error.message);
    }
};

/**
 * Get operation status
 * GET /api/admin/bulk-operations/:id
 */
export const getOperationController = async (req, res) => {
    try {
        const { id } = req.params;

        const operation = await getBulkOperation(id);

        return apiResponse.success(res, "Operation retrieved successfully", {
            operation,
        });
    } catch (error) {
        logger.error("Get operation controller error:", error);
        return apiResponse.notFound(res, error.message);
    }
};

/**
 * List operations
 * GET /api/admin/bulk-operations
 */
export const listOperationsController = async (req, res) => {
    try {
        const { type, status, page = 1, limit = 20 } = req.query;

        const filters = {};
        if (type) filters.type = type;
        if (status) filters.status = status;
        filters.performedBy = req.admin._id;

        const result = await listBulkOperations(
            filters,
            parseInt(page),
            parseInt(limit)
        );

        return apiResponse.successWithPagination(
            res,
            "Operations retrieved successfully",
            result.operations,
            result.pagination
        );
    } catch (error) {
        logger.error("List operations controller error:", error);
        return apiResponse.serverError(res, error.message);
    }
};

export default {
    exportProductsController,
    importProductsController,
    downloadTemplateController,
    getOperationController,
    listOperationsController,
};
