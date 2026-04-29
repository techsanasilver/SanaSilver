import express from "express";
import {
    exportProductsController,
    importProductsController,
    downloadTemplateController,
    getOperationController,
    listOperationsController,
} from "./bulk-operation.controller.js";
import { uploadExcel, handleUploadError } from "./bulk-operation.middleware.js";
import authMiddleware from "../../shared/middlewares/auth.middleware.js";
import { requirePermission } from "../../shared/middlewares/role.middleware.js";

const router = express.Router();

router.use(authMiddleware);

/**
 * Export products
 * POST /api/admin/bulk-operations/export
 * Body: { category?, subcategory?, status?, isFeatured?, isBestseller?, isNewArrival? }
 */
router.post(
    "/export",
    requirePermission("bulk-operations.export"),
    exportProductsController,
);

/**
 * Import products
 * POST /api/admin/bulk-operations/import
 * Form-data: file (Excel file)
 */
router.post(
    "/import",
    requirePermission("bulk-operations.import"),
    uploadExcel,
    handleUploadError,
    importProductsController,
);

/**
 * Download template
 * GET /api/admin/bulk-operations/template
 */
router.get(
    "/template",
    requirePermission("bulk-operations.export"),
    downloadTemplateController,
);

/**
 * Get operation by ID
 * GET /api/admin/bulk-operations/:id
 */
router.get(
    "/:id",
    requirePermission("bulk-operations.export"),
    getOperationController,
);

/**
 * List operations
 * GET /api/admin/bulk-operations
 * Query: type?, status?, page?, limit?
 */
router.get(
    "/",
    requirePermission("bulk-operations.export"),
    listOperationsController,
);

export default router;
