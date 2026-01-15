import BulkOperation from "./bulk-operation.model.js";
import {
    readWorkbookFromBuffer,
    getWorksheet,
    worksheetToJSON,
    validateColumns,
} from "./utils/excel.util.js";
import {
    parseProductRow,
    parseVariantRow,
    groupVariantsByProduct,
} from "./utils/parser.util.js";
import { validateImportData } from "./services/validator.service.js";
import { exportProducts } from "./services/export.service.js";
import { importProducts } from "./services/import.service.js";
import { generateTemplate } from "./services/template.service.js";
import logger from "../../shared/utils/logger.util.js";

/**
 * Required columns for Products sheet
 * These are just the identifier columns - validator will check actual data based on _action
 */
const REQUIRED_PRODUCT_COLUMNS = [
    "_action", // Required: CREATE or UPDATE
    "product_id", // Required for UPDATE
    "product_name", // Required for CREATE
];

/**
 * Required columns for Variants sheet
 * For UPDATE: only needs sku (unique identifier)
 * For CREATE: sku is auto-generated, validator will check all other required fields
 */
const REQUIRED_VARIANT_COLUMNS = [
    "_action", // Required: CREATE or UPDATE
    "product_name", // Required to link variant to product
];

/**
 * Export products to Excel file
 */
export const exportProductsService = async (filters, performedBy) => {
    const startTime = Date.now();

    try {
        // Create bulk operation record
        const bulkOp = await BulkOperation.create({
            type: "export",
            entity: "products",
            status: "processing",
            performedBy,
            startedAt: new Date(),
            filters,
        });

        logger.info(`Export started: ${bulkOp._id}`);

        // Export products (generate buffer)
        const { buffer, filename, stats } = await exportProducts(filters);

        // Update bulk operation record (no file saving)
        bulkOp.status = "completed";
        bulkOp.fileName = filename;
        bulkOp.fileSize = buffer.length;
        bulkOp.completedAt = new Date();
        bulkOp.duration = Date.now() - startTime;
        bulkOp.totalRows = stats.totalProducts + stats.totalVariants;

        await bulkOp.save();

        logger.info(`Export completed: ${bulkOp._id}`);

        // Return buffer and metadata for direct streaming
        return {
            buffer,
            filename,
            operationId: bulkOp._id,
            stats,
        };
    } catch (error) {
        logger.error("Export failed:", error);
        throw error;
    }
};

/**
 * Import products from Excel file
 */
export const importProductsService = async (
    fileBuffer,
    fileName,
    fileSize,
    performedBy
) => {
    const startTime = Date.now();

    let bulkOp;

    try {
        // Create bulk operation record
        bulkOp = await BulkOperation.create({
            type: "import",
            entity: "products",
            status: "processing",
            fileName,
            fileSize,
            performedBy,
            startedAt: new Date(),
        });

        logger.info(`Import started: ${bulkOp._id}`);

        // Read Excel file
        const workbook = await readWorkbookFromBuffer(fileBuffer);

        // Get worksheets
        const productsSheet = getWorksheet(workbook, "Products");
        const variantsSheet = getWorksheet(workbook, "Variants");

        // Convert to JSON
        const productsData = worksheetToJSON(productsSheet);
        const variantsData = worksheetToJSON(variantsSheet);

        logger.info(
            `Parsed ${productsData.length} products, ${variantsData.length} variants`
        );

        // Validate column structure
        const productColumns = Object.keys(productsData[0] || {}).filter(
            (key) => key !== "_rowNumber"
        );
        const variantColumns = Object.keys(variantsData[0] || {}).filter(
            (key) => key !== "_rowNumber"
        );

        const productColumnsValidation = validateColumns(
            productColumns,
            REQUIRED_PRODUCT_COLUMNS
        );
        const variantColumnsValidation = validateColumns(
            variantColumns,
            REQUIRED_VARIANT_COLUMNS
        );

        if (!productColumnsValidation.isValid) {
            throw new Error(
                `Missing required columns in Products sheet: ${productColumnsValidation.missingColumns.join(
                    ", "
                )}`
            );
        }

        if (!variantColumnsValidation.isValid) {
            throw new Error(
                `Missing required columns in Variants sheet: ${variantColumnsValidation.missingColumns.join(
                    ", "
                )}`
            );
        }

        // Parse rows
        const parsedProducts = productsData
            .map(parseProductRow)
            .filter(Boolean);
        const parsedVariants = variantsData
            .map(parseVariantRow)
            .filter(Boolean);

        // Update bulk operation with row counts
        bulkOp.totalRows = parsedProducts.length + parsedVariants.length;
        await bulkOp.save();

        // Validate data (Phase 1: Complete validation)
        logger.info("Starting validation...");
        const validationResult = await validateImportData(
            parsedProducts,
            parsedVariants
        );

        if (!validationResult.valid) {
            // Validation failed
            bulkOp.status = "failed";
            bulkOp.errors = validationResult.errors;
            bulkOp.warnings = validationResult.warnings;
            bulkOp.processedRows = 0;
            bulkOp.stats = {
                products: {
                    valid: 0,
                    invalid: parsedProducts.length,
                    created: 0,
                    updated: 0,
                },
                variants: {
                    valid: 0,
                    invalid: parsedVariants.length,
                    created: 0,
                    updated: 0,
                },
            };
            bulkOp.completedAt = new Date();
            bulkOp.duration = Date.now() - startTime;

            await bulkOp.save();

            logger.warn(
                `Validation failed with ${validationResult.errors.length} errors`
            );

            return bulkOp;
        }

        // Validation passed, proceed with import (Phase 2: Import with stop-on-error)
        logger.info("Validation passed, starting import...");

        const importStats = await importProducts(
            parsedProducts,
            parsedVariants,
            performedBy
        );

        // Update bulk operation with success
        bulkOp.status = "completed";
        bulkOp.processedRows = parsedProducts.length + parsedVariants.length;
        bulkOp.stats = {
            products: {
                valid: parsedProducts.length,
                invalid: 0,
                created: importStats.products.created,
                updated: importStats.products.updated,
            },
            variants: {
                valid: parsedVariants.length,
                invalid: 0,
                created: importStats.variants.created,
                updated: importStats.variants.updated,
            },
        };
        bulkOp.errors = [];
        bulkOp.warnings = validationResult.warnings;
        bulkOp.completedAt = new Date();
        bulkOp.duration = Date.now() - startTime;

        await bulkOp.save();

        logger.info(`Import completed: ${bulkOp._id}`, importStats);

        return bulkOp;
    } catch (error) {
        logger.error("Import failed:", error);

        // Update bulk operation with failure
        if (bulkOp) {
            bulkOp.status = "failed";
            bulkOp.errors = [
                {
                    row: 0,
                    sheet: "System",
                    field: "general",
                    message: error.message,
                    severity: "error",
                },
            ];
            bulkOp.completedAt = new Date();
            bulkOp.duration = Date.now() - startTime;

            await bulkOp.save();
        }

        throw error;
    }
};

/**
 * Generate template
 */
export const generateTemplateService = async () => {
    try {
        const { buffer, filename } = await generateTemplate();

        return {
            buffer,
            filename,
        };
    } catch (error) {
        logger.error("Template generation failed:", error);
        throw error;
    }
};

/**
 * Get bulk operation by ID
 */
export const getBulkOperation = async (operationId) => {
    const operation = await BulkOperation.findById(operationId).populate(
        "performedBy",
        "name email"
    );

    if (!operation) {
        throw new Error("Bulk operation not found");
    }

    return operation;
};

/**
 * List bulk operations
 */
export const listBulkOperations = async (
    filters = {},
    page = 1,
    limit = 20
) => {
    const query = {};

    if (filters.type) {
        query.type = filters.type;
    }

    if (filters.status) {
        query.status = filters.status;
    }

    if (filters.performedBy) {
        query.performedBy = filters.performedBy;
    }

    const skip = (page - 1) * limit;

    const [operations, total] = await Promise.all([
        BulkOperation.find(query)
            .populate("performedBy", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        BulkOperation.countDocuments(query),
    ]);

    return {
        operations,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

/**
 * Cleanup expired exports
 */
export const cleanupExpiredExports = async () => {
    try {
        const expiredOps = await BulkOperation.find({
            type: "export",
            expiresAt: { $lt: new Date() },
            filePath: { $exists: true },
        });

        for (const op of expiredOps) {
            try {
                // Delete file
                await fs.unlink(op.filePath);
                logger.info(`Deleted expired export file: ${op.filePath}`);

                // Update record
                op.filePath = null;
                op.downloadUrl = null;
                await op.save();
            } catch (error) {
                logger.error(`Error deleting file ${op.filePath}:`, error);
            }
        }

        logger.info(`Cleaned up ${expiredOps.length} expired exports`);

        return expiredOps.length;
    } catch (error) {
        logger.error("Cleanup failed:", error);
        throw error;
    }
};

export default {
    exportProductsService,
    importProductsService,
    generateTemplateService,
    getBulkOperation,
    listBulkOperations,
    cleanupExpiredExports,
};
