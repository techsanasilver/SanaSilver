import mongoose from "mongoose";

const errorSchema = new mongoose.Schema(
    {
        row: {
            type: Number,
            required: true,
        },
        sheet: {
            type: String,
            required: true,
        },
        action: String,
        productName: String,
        variantName: String,
        severity: {
            type: String,
            enum: ["error", "warning"],
            default: "error",
        },
        errors: [
            {
                field: String,
                rule: String,
                message: String,
                value: mongoose.Schema.Types.Mixed,
            },
        ],
    },
    { _id: false, suppressReservedKeysWarning: true }
);

const bulkOperationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["import", "export"],
            required: true,
        },
        entity: {
            type: String,
            enum: ["products"],
            default: "products",
        },
        status: {
            type: String,
            enum: ["pending", "processing", "completed", "failed"],
            default: "pending",
        },

        // File information
        fileName: String,
        fileSize: Number, // In bytes
        filePath: String, // For temporary storage

        // Import-specific fields
        totalRows: Number,
        processedRows: Number,
        stats: {
            products: {
                created: { type: Number, default: 0 },
                updated: { type: Number, default: 0 },
                valid: { type: Number, default: 0 },
                invalid: { type: Number, default: 0 },
            },
            variants: {
                created: { type: Number, default: 0 },
                updated: { type: Number, default: 0 },
                valid: { type: Number, default: 0 },
                invalid: { type: Number, default: 0 },
            },
        },
        errors: [errorSchema],
        warnings: [errorSchema],

        // Export-specific fields
        downloadUrl: String,
        expiresAt: Date,
        filters: mongoose.Schema.Types.Mixed,

        // Tracking
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            required: true,
        },
        startedAt: Date,
        completedAt: Date,
        duration: Number, // In milliseconds
        errorMessage: String, // For failed operations
    },
    {
        timestamps: true,
        suppressReservedKeysWarning: true,
    }
);

// Index for querying
bulkOperationSchema.index({ type: 1, status: 1, createdAt: -1 });
bulkOperationSchema.index({ performedBy: 1, createdAt: -1 });
bulkOperationSchema.index({ expiresAt: 1 }); // For cleanup

const BulkOperation = mongoose.model("BulkOperation", bulkOperationSchema);

export default BulkOperation;
