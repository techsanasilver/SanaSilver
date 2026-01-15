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

const router = express.Router();

/**
 * All routes require authentication
 */
router.use(authMiddleware);

/**
 * Export products
 * POST /api/admin/bulk-operations/export
 * Body: { category?, subcategory?, status?, isFeatured?, isBestseller?, isNewArrival? }
 */
router.post("/export", exportProductsController);

/**
 * Import products
 * POST /api/admin/bulk-operations/import
 * Form-data: file (Excel file)
 */
router.post(
    "/import",
    uploadExcel,
    handleUploadError,
    importProductsController
);

/**
 * Download template
 * GET /api/admin/bulk-operations/template
 */
router.get("/template", downloadTemplateController);

/**
 * Get operation by ID
 * GET /api/admin/bulk-operations/:id
 */
router.get("/:id", getOperationController);

/**
 * List operations
 * GET /api/admin/bulk-operations
 * Query: type?, status?, page?, limit?
 */
router.get("/", listOperationsController);

export default router;
