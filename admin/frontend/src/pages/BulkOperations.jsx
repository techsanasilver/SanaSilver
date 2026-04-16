import React, { useState, useEffect, useCallback } from "react";
import logger from "../utils/logger.util";
import {
    MdFileDownload,
    MdFileUpload,
    MdDescription,
    MdRefresh,
    MdCheckCircle,
    MdError,
    MdHourglassEmpty,
    MdSync,
    MdExpandMore,
    MdExpandLess,
    MdWarning,
    MdClose,
} from "react-icons/md";
import {
    exportProducts,
    downloadExportedFile,
    importProducts,
    downloadTemplate,
    listBulkOperations,
    getBulkOperation,
} from "../api/bulk.api";

const BulkOperations = () => {
    const [operations, setOperations] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
    });
    const [filters, setFilters] = useState({
        type: "",
        status: "",
    });
    const [loading, setLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState(null);
    const [expandedOp, setExpandedOp] = useState(null);

    // Messages state
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }
    const [fileError, setFileError] = useState(null);

    // Import result state
    const [importResult, setImportResult] = useState(null);

    // Export filters
    const [exportFilters, setExportFilters] = useState({
        category: "",
        status: "",
        isFeatured: "",
        isBestseller: "",
        isNewArrival: "",
    });

    // Fetch operations list
    const fetchOperations = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...filters,
            };

            const response = await listBulkOperations(params);

            if (response.success) {
                setOperations(response.data);
                setPagination(response.meta.pagination);
            }
        } catch (error) {
            logger.error("Failed to fetch operations:", error);
            setMessage({
                type: "error",
                text:
                    error.response?.data?.message ||
                    "Failed to load operations",
            });
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, filters]);

    useEffect(() => {
        fetchOperations();
    }, [fetchOperations]);

    // Handle export
    const handleExport = async () => {
        setExportLoading(true);
        try {
            // Clean filters (remove empty values)
            const cleanFilters = Object.entries(exportFilters)
                .filter(([_, value]) => value !== "")
                .reduce((acc, [key, value]) => {
                    acc[key] = value;
                    return acc;
                }, {});

            const blob = await exportProducts(cleanFilters);

            // Generate filename with timestamp
            const timestamp = new Date()
                .toISOString()
                .replace(/[:.]/g, "-")
                .slice(0, -5);
            const filename = `products-export-${timestamp}.xlsx`;

            downloadExportedFile(blob, filename);
            setMessage({
                type: "success",
                text: "Export completed successfully. File download started.",
            });

            // Refresh operations list
            setTimeout(() => {
                fetchOperations();
            }, 1000);
        } catch (error) {
            logger.error("Export error:", error);
            setMessage({
                type: "error",
                text: error.response?.data?.message || "Export failed",
            });
        } finally {
            setExportLoading(false);
        }
    };

    // Handle template download
    const handleDownloadTemplate = async () => {
        try {
            const blob = await downloadTemplate();
            downloadExportedFile(blob, "products-import-template.xlsx");
            setMessage({
                type: "success",
                text: "Template downloaded successfully",
            });
        } catch (error) {
            logger.error("Template download error:", error);
            setMessage({
                type: "error",
                text: "Failed to download template",
            });
        }
    };

    // Handle file selection
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        setFileError(null);
        setImportResult(null);
        setMessage(null);

        if (file) {
            // Check file type
            if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
                setFileError("Please select an Excel file (.xlsx or .xls)");
                event.target.value = ""; // Clear input
                return;
            }

            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setFileError("File size must be less than 10MB");
                event.target.value = ""; // Clear input
                return;
            }

            setSelectedFileName({ name: file.name, size: file.size });
        } else {
            setSelectedFileName(null);
        }
    };

    // Handle import
    const handleImport = async () => {
        // Get file directly from input element
        const fileInput = document.getElementById("import-file");
        const file = fileInput?.files?.[0];

        if (!file) {
            setFileError("Please select a file first");
            return;
        }

        setImportLoading(true);
        setMessage(null);
        setImportResult(null);

        try {
            const response = await importProducts(file);

            if (response.success) {
                // Success - show result
                setImportResult({
                    status: "success",
                    message: response.message,
                    operationId: response.data.operationId,
                    stats: response.data.stats,
                    warnings: response.data.warnings || [],
                    errors: [],
                });

                setSelectedFileName(null);
                document.getElementById("import-file").value = "";
                fetchOperations();
            } else {
                // Validation failed - should not reach here as backend returns 400
                setImportResult({
                    status: "failed",
                    message: response.message,
                    errors: response.data?.errors || [],
                    warnings: response.data?.warnings || [],
                    stats: response.data?.stats,
                });
            }
        } catch (error) {
            logger.error("Import error:", error);

            // Handle validation errors from backend (status 400 or 422)
            if (
                (error.response?.status === 400 ||
                    error.response?.status === 422) &&
                error.response?.data?.data
            ) {
                const data = error.response.data.data;
                setImportResult({
                    status: "failed",
                    message: error.response.data.message,
                    operationId: data.operationId,
                    errors: data.errors || [],
                    warnings: data.warnings || [],
                    stats: data.stats,
                });
            } else {
                setMessage({
                    type: "error",
                    text: error.response?.data?.message || "Import failed",
                });
            }
        } finally {
            setImportLoading(false);
        }
    };

    // Toggle operation details
    const toggleOperationDetails = async (opId) => {
        if (expandedOp === opId) {
            setExpandedOp(null);
        } else {
            setExpandedOp(opId);

            // Fetch full details if needed
            try {
                const response = await getBulkOperation(opId);
                if (response.success) {
                    // Update the operation in the list
                    setOperations((prev) =>
                        prev.map((op) =>
                            op._id === opId ? response.data.operation : op,
                        ),
                    );
                }
            } catch (error) {
                logger.error("Failed to fetch operation details:", error);
            }
        }
    };

    // Format duration
    const formatDuration = (ms) => {
        if (!ms) return "N/A";
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        return `${seconds}s`;
    };

    // Status badge
    const StatusBadge = ({ status }) => {
        const styles = {
            pending: "bg-warning/10 text-warning border-warning/30",
            processing: "bg-info/10 text-info border-info/30",
            completed: "bg-success/10 text-success border-success/30",
            failed: "bg-danger/10 text-danger border-danger/30",
        };

        const icons = {
            pending: <MdHourglassEmpty className="w-4 h-4" />,
            processing: <MdSync className="w-4 h-4 animate-spin" />,
            completed: <MdCheckCircle className="w-4 h-4" />,
            failed: <MdError className="w-4 h-4" />,
        };

        return (
            <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${
                    styles[status] || styles.pending
                }`}
            >
                {icons[status]}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text">
                        Bulk Operations
                    </h1>
                    <p className="text-sm text-text-secondary mt-1">
                        Import and export products in bulk
                    </p>
                </div>

                <button
                    onClick={fetchOperations}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-surface rounded-lg hover:bg-primary-dark disabled:opacity-50"
                >
                    <MdRefresh className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* Global Message */}
            {message && (
                <div
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                        message.type === "success"
                            ? "bg-success/10 border-success/30 text-success"
                            : "bg-danger/10 border-danger/30 text-danger"
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {message.type === "success" ? (
                            <MdCheckCircle className="w-5 h-5" />
                        ) : (
                            <MdError className="w-5 h-5" />
                        )}
                        <span>{message.text}</span>
                    </div>
                    <button
                        onClick={() => setMessage(null)}
                        className="text-text-secondary hover:text-text"
                    >
                        <MdClose className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Export Section */}
            <div className="bg-surface rounded-lg shadow-md p-6 border border-border">
                <div className="flex items-center gap-2 mb-4">
                    <MdFileDownload className="text-info w-6 h-6" />
                    <h2 className="text-lg font-semibold text-text">
                        Export Products
                    </h2>
                </div>

                <p className="text-sm text-text-secondary mb-4">
                    Export products to Excel file with optional filters
                </p>

                {/* Export Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-text mb-1">
                            Category
                        </label>
                        <input
                            type="text"
                            placeholder="Category ID"
                            value={exportFilters.category}
                            onChange={(e) =>
                                setExportFilters({
                                    ...exportFilters,
                                    category: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text mb-1">
                            Status
                        </label>
                        <select
                            value={exportFilters.status}
                            onChange={(e) =>
                                setExportFilters({
                                    ...exportFilters,
                                    status: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="draft">Draft</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text mb-1">
                            Featured
                        </label>
                        <select
                            value={exportFilters.isFeatured}
                            onChange={(e) =>
                                setExportFilters({
                                    ...exportFilters,
                                    isFeatured: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text mb-1">
                            Bestseller
                        </label>
                        <select
                            value={exportFilters.isBestseller}
                            onChange={(e) =>
                                setExportFilters({
                                    ...exportFilters,
                                    isBestseller: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text mb-1">
                            New Arrival
                        </label>
                        <select
                            value={exportFilters.isNewArrival}
                            onChange={(e) =>
                                setExportFilters({
                                    ...exportFilters,
                                    isNewArrival: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </select>
                    </div>
                </div>

                <button
                    onClick={handleExport}
                    disabled={exportLoading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-info text-surface rounded-lg hover:bg-info/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {exportLoading ? (
                        <>
                            <MdSync className="w-5 h-5 animate-spin" />
                            Exporting...
                        </>
                    ) : (
                        <>
                            <MdFileDownload className="w-5 h-5" />
                            Export to Excel
                        </>
                    )}
                </button>
            </div>

            {/* Import Section */}
            <div className="bg-surface rounded-lg shadow-md p-6 border border-border">
                <div className="flex items-center gap-2 mb-4">
                    <MdFileUpload className="text-success w-6 h-6" />
                    <h2 className="text-lg font-semibold text-text">
                        Import Products
                    </h2>
                </div>

                <p className="text-sm text-text-secondary mb-4">
                    Upload an Excel file to import products and variants
                </p>

                <div className="space-y-4">
                    {/* Template Download */}
                    <div className="flex items-center gap-4 p-4 bg-info/10 border border-info/30 rounded-lg">
                        <MdDescription className="text-info w-8 h-8 shrink-0" />
                        <div className="flex-1">
                            <h3 className="font-medium text-text">
                                Download Template
                            </h3>
                            <p className="text-sm text-text-secondary">
                                Get the Excel template with proper format and
                                example data
                            </p>
                        </div>
                        <button
                            onClick={handleDownloadTemplate}
                            className="px-4 py-2 bg-info text-white rounded-lg hover:bg-info/90"
                        >
                            Download
                        </button>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-text mb-2">
                            Select Excel File
                        </label>
                        <input
                            id="import-file"
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileSelect}
                            className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-success/10 file:text-success hover:file:bg-success/20"
                        />
                        {selectedFileName && (
                            <p className="mt-2 text-sm text-text-secondary">
                                Selected: {selectedFileName.name} (
                                {(selectedFileName.size / 1024).toFixed(2)} KB)
                            </p>
                        )}
                        {fileError && (
                            <p className="mt-2 text-sm text-danger flex items-center gap-1">
                                <MdError className="w-4 h-4" />
                                {fileError}
                            </p>
                        )}
                    </div>

                    <button
                        onClick={handleImport}
                        disabled={importLoading || !selectedFileName}
                        className="flex items-center gap-2 px-6 py-2.5 bg-success text-surface rounded-lg hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {importLoading ? (
                            <>
                                <MdSync className="w-5 h-5 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <MdFileUpload className="w-5 h-5" />
                                Import from Excel
                            </>
                        )}
                    </button>

                    {/* Import Result */}
                    {importResult && (
                        <div className="space-y-4 mt-6 p-4 bg-background border border-border rounded-lg">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-text">
                                    Import Result
                                </h3>
                                <StatusBadge
                                    status={
                                        importResult.status === "success"
                                            ? "completed"
                                            : "failed"
                                    }
                                />
                            </div>

                            <p
                                className={`text-sm ${importResult.status === "success" ? "text-success" : "text-danger"}`}
                            >
                                {importResult.message}
                            </p>

                            {/* Stats Summary */}
                            {importResult.stats && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-surface p-4 rounded-lg border border-border">
                                        <h4 className="font-medium text-text mb-2">
                                            Products
                                        </h4>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-text-secondary">
                                                    Created:
                                                </span>
                                                <span className="font-medium text-success">
                                                    {
                                                        importResult.stats
                                                            .products.created
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-text-secondary">
                                                    Updated:
                                                </span>
                                                <span className="font-medium text-info">
                                                    {
                                                        importResult.stats
                                                            .products.updated
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-text-secondary">
                                                    Valid:
                                                </span>
                                                <span className="font-medium text-success">
                                                    {
                                                        importResult.stats
                                                            .products.valid
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-text-secondary">
                                                    Invalid:
                                                </span>
                                                <span className="font-medium text-danger">
                                                    {
                                                        importResult.stats
                                                            .products.invalid
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-surface p-4 rounded-lg border border-border">
                                        <h4 className="font-medium text-text mb-2">
                                            Variants
                                        </h4>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-text-secondary">
                                                    Created:
                                                </span>
                                                <span className="font-medium text-success">
                                                    {
                                                        importResult.stats
                                                            .variants.created
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-text-secondary">
                                                    Updated:
                                                </span>
                                                <span className="font-medium text-info">
                                                    {
                                                        importResult.stats
                                                            .variants.updated
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-text-secondary">
                                                    Valid:
                                                </span>
                                                <span className="font-medium text-success">
                                                    {
                                                        importResult.stats
                                                            .variants.valid
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-text-secondary">
                                                    Invalid:
                                                </span>
                                                <span className="font-medium text-danger">
                                                    {
                                                        importResult.stats
                                                            .variants.invalid
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Errors Table */}
                            {importResult.errors &&
                                importResult.errors.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-danger flex items-center gap-2">
                                            <MdError className="w-5 h-5" />
                                            Errors ({importResult.errors.length}
                                            )
                                        </h4>
                                        <div className="overflow-x-auto max-h-96 border border-danger/30 rounded-lg">
                                            <table className="w-full text-sm">
                                                <thead className="bg-danger/10 sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-danger font-medium">
                                                            Row
                                                        </th>
                                                        <th className="px-4 py-2 text-left text-danger font-medium">
                                                            Sheet
                                                        </th>
                                                        <th className="px-4 py-2 text-left text-danger font-medium">
                                                            Product/Variant
                                                        </th>
                                                        <th className="px-4 py-2 text-left text-danger font-medium">
                                                            Field
                                                        </th>
                                                        <th className="px-4 py-2 text-left text-danger font-medium">
                                                            Error
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-surface divide-y divide-danger/20">
                                                    {importResult.errors.map(
                                                        (error, idx) =>
                                                            error.errors?.map(
                                                                (
                                                                    err,
                                                                    errIdx,
                                                                ) => (
                                                                    <tr
                                                                        key={`${idx}-${errIdx}`}
                                                                        className="hover:bg-danger/10"
                                                                    >
                                                                        {errIdx ===
                                                                            0 && (
                                                                            <>
                                                                                <td
                                                                                    className="px-4 py-2 font-medium"
                                                                                    rowSpan={
                                                                                        error
                                                                                            .errors
                                                                                            .length
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        error.row
                                                                                    }
                                                                                </td>
                                                                                <td
                                                                                    className="px-4 py-2"
                                                                                    rowSpan={
                                                                                        error
                                                                                            .errors
                                                                                            .length
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        error.sheet
                                                                                    }
                                                                                </td>
                                                                                <td
                                                                                    className="px-4 py-2 text-text"
                                                                                    rowSpan={
                                                                                        error
                                                                                            .errors
                                                                                            .length
                                                                                    }
                                                                                >
                                                                                    {error.productName ||
                                                                                        error.variantName ||
                                                                                        "-"}
                                                                                </td>
                                                                            </>
                                                                        )}
                                                                        <td className="px-4 py-2 font-mono text-xs text-text-secondary">
                                                                            {
                                                                                err.field
                                                                            }
                                                                        </td>
                                                                        <td className="px-4 py-2 text-danger">
                                                                            {
                                                                                err.message
                                                                            }
                                                                        </td>
                                                                    </tr>
                                                                ),
                                                            ),
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                            {/* Warnings Table */}
                            {importResult.warnings &&
                                importResult.warnings.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-warning flex items-center gap-2">
                                            <MdWarning className="w-5 h-5" />
                                            Warnings (
                                            {importResult.warnings.length})
                                        </h4>
                                        <div className="overflow-x-auto max-h-64 border border-warning/30 rounded-lg">
                                            <table className="w-full text-sm">
                                                <thead className="bg-warning/10 sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-warning font-medium">
                                                            Row
                                                        </th>
                                                        <th className="px-4 py-2 text-left text-warning font-medium">
                                                            Sheet
                                                        </th>
                                                        <th className="px-4 py-2 text-left text-warning font-medium">
                                                            Product/Variant
                                                        </th>
                                                        <th className="px-4 py-2 text-left text-warning font-medium">
                                                            Warning
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-surface divide-y divide-warning/20">
                                                    {importResult.warnings.map(
                                                        (warning, idx) =>
                                                            warning.errors?.map(
                                                                (
                                                                    warn,
                                                                    warnIdx,
                                                                ) => (
                                                                    <tr
                                                                        key={`${idx}-${warnIdx}`}
                                                                        className="hover:bg-warning/10"
                                                                    >
                                                                        {warnIdx ===
                                                                            0 && (
                                                                            <>
                                                                                <td
                                                                                    className="px-4 py-2 font-medium"
                                                                                    rowSpan={
                                                                                        warning
                                                                                            .errors
                                                                                            .length
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        warning.row
                                                                                    }
                                                                                </td>
                                                                                <td
                                                                                    className="px-4 py-2"
                                                                                    rowSpan={
                                                                                        warning
                                                                                            .errors
                                                                                            .length
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        warning.sheet
                                                                                    }
                                                                                </td>
                                                                                <td
                                                                                    className="px-4 py-2 text-text"
                                                                                    rowSpan={
                                                                                        warning
                                                                                            .errors
                                                                                            .length
                                                                                    }
                                                                                >
                                                                                    {warning.productName ||
                                                                                        warning.variantName ||
                                                                                        "-"}
                                                                                </td>
                                                                            </>
                                                                        )}
                                                                        <td className="px-4 py-2 text-warning">
                                                                            {
                                                                                warn.message
                                                                            }
                                                                        </td>
                                                                    </tr>
                                                                ),
                                                            ),
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                        </div>
                    )}
                </div>
            </div>

            {/* Operations History */}
            <div className="bg-surface rounded-lg shadow-md border border-border">
                <div className="p-6 border-b border-border">
                    <h2 className="text-lg font-semibold text-text mb-4">
                        Operations History
                    </h2>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Type
                            </label>
                            <select
                                value={filters.type}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        type: e.target.value,
                                    })
                                }
                                className="px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All</option>
                                <option value="export">Export</option>
                                <option value="import">Import</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text mb-1">
                                Status
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        status: e.target.value,
                                    })
                                }
                                className="px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="completed">Completed</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Operations List */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <MdSync className="w-8 h-8 animate-spin text-info" />
                        </div>
                    ) : operations.length === 0 ? (
                        <div className="text-center py-12 text-text-secondary">
                            No operations found
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-background border-b border-border">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                        File
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                        Stats
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                        Duration
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-surface divide-y divide-border">
                                {operations.map((op) => (
                                    <React.Fragment key={op._id}>
                                        <tr className="hover:bg-background">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                                                        op.type === "export"
                                                            ? "bg-info/20 text-info"
                                                            : "bg-success/20 text-success"
                                                    }`}
                                                >
                                                    {op.type === "export" ? (
                                                        <MdFileDownload />
                                                    ) : (
                                                        <MdFileUpload />
                                                    )}
                                                    {op.type
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        op.type.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge
                                                    status={op.status}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <div className="font-medium text-gray-900">
                                                        {op.fileName || "N/A"}
                                                    </div>
                                                    {op.fileSize && (
                                                        <div className="text-text-secondary">
                                                            {(
                                                                op.fileSize /
                                                                1024
                                                            ).toFixed(2)}{" "}
                                                            KB
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {op.stats && (
                                                    <div className="text-sm text-text-secondary">
                                                        <div>
                                                            Products:{" "}
                                                            {
                                                                op.stats
                                                                    .products
                                                                    .created
                                                            }
                                                            /
                                                            {
                                                                op.stats
                                                                    .products
                                                                    .updated
                                                            }
                                                        </div>
                                                        <div>
                                                            Variants:{" "}
                                                            {
                                                                op.stats
                                                                    .variants
                                                                    .created
                                                            }
                                                            /
                                                            {
                                                                op.stats
                                                                    .variants
                                                                    .updated
                                                            }
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                                {formatDuration(op.duration)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                                {new Date(
                                                    op.createdAt,
                                                ).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() =>
                                                        toggleOperationDetails(
                                                            op._id,
                                                        )
                                                    }
                                                    className="text-info hover:text-blue-800 flex items-center gap-1"
                                                >
                                                    {expandedOp === op._id ? (
                                                        <>
                                                            <MdExpandLess />
                                                            Hide
                                                        </>
                                                    ) : (
                                                        <>
                                                            <MdExpandMore />
                                                            Details
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Expanded Details */}
                                        {expandedOp === op._id && (
                                            <tr>
                                                <td
                                                    colSpan="7"
                                                    className="px-6 py-4 bg-background"
                                                >
                                                    <div className="space-y-4">
                                                        {/* Stats Detail */}
                                                        {op.stats && (
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="bg-surface p-4 rounded-lg border border-border">
                                                                    <h4 className="font-medium text-text mb-2">
                                                                        Products
                                                                    </h4>
                                                                    <div className="space-y-1 text-sm">
                                                                        <div className="flex justify-between">
                                                                            <span className="text-text-secondary">
                                                                                Created:
                                                                            </span>
                                                                            <span className="font-medium">
                                                                                {
                                                                                    op
                                                                                        .stats
                                                                                        .products
                                                                                        .created
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-text-secondary">
                                                                                Updated:
                                                                            </span>
                                                                            <span className="font-medium">
                                                                                {
                                                                                    op
                                                                                        .stats
                                                                                        .products
                                                                                        .updated
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-text-secondary">
                                                                                Valid:
                                                                            </span>
                                                                            <span className="font-medium text-success">
                                                                                {
                                                                                    op
                                                                                        .stats
                                                                                        .products
                                                                                        .valid
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-text-secondary">
                                                                                Invalid:
                                                                            </span>
                                                                            <span className="font-medium text-danger">
                                                                                {
                                                                                    op
                                                                                        .stats
                                                                                        .products
                                                                                        .invalid
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="bg-surface p-4 rounded-lg border border-border">
                                                                    <h4 className="font-medium text-text mb-2">
                                                                        Variants
                                                                    </h4>
                                                                    <div className="space-y-1 text-sm">
                                                                        <div className="flex justify-between">
                                                                            <span className="text-text-secondary">
                                                                                Created:
                                                                            </span>
                                                                            <span className="font-medium">
                                                                                {
                                                                                    op
                                                                                        .stats
                                                                                        .variants
                                                                                        .created
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-text-secondary">
                                                                                Updated:
                                                                            </span>
                                                                            <span className="font-medium">
                                                                                {
                                                                                    op
                                                                                        .stats
                                                                                        .variants
                                                                                        .updated
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-text-secondary">
                                                                                Valid:
                                                                            </span>
                                                                            <span className="font-medium text-success">
                                                                                {
                                                                                    op
                                                                                        .stats
                                                                                        .variants
                                                                                        .valid
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-text-secondary">
                                                                                Invalid:
                                                                            </span>
                                                                            <span className="font-medium text-danger">
                                                                                {
                                                                                    op
                                                                                        .stats
                                                                                        .variants
                                                                                        .invalid
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Errors */}
                                                        {op.errors &&
                                                            op.errors.length >
                                                                0 && (
                                                                <div className="bg-danger/10 border border-danger/30 rounded-lg p-4">
                                                                    <h4 className="font-medium text-danger mb-2 flex items-center gap-2">
                                                                        <MdError />
                                                                        Errors (
                                                                        {
                                                                            op
                                                                                .errors
                                                                                .length
                                                                        }
                                                                        )
                                                                    </h4>
                                                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                                                        {op.errors
                                                                            .slice(
                                                                                0,
                                                                                10,
                                                                            )
                                                                            .map(
                                                                                (
                                                                                    error,
                                                                                    idx,
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            idx
                                                                                        }
                                                                                        className="text-sm bg-surface p-2 rounded border border-danger/30"
                                                                                    >
                                                                                        <div className="font-medium text-danger">
                                                                                            Row{" "}
                                                                                            {
                                                                                                error.row
                                                                                            }{" "}
                                                                                            -{" "}
                                                                                            {
                                                                                                error.sheet
                                                                                            }
                                                                                            {error.productName &&
                                                                                                ` (${error.productName})`}
                                                                                        </div>
                                                                                        {error.errors?.map(
                                                                                            (
                                                                                                e,
                                                                                                i,
                                                                                            ) => (
                                                                                                <div
                                                                                                    key={
                                                                                                        i
                                                                                                    }
                                                                                                    className="text-danger ml-4"
                                                                                                >
                                                                                                    •{" "}
                                                                                                    {
                                                                                                        e.field
                                                                                                    }

                                                                                                    :{" "}
                                                                                                    {
                                                                                                        e.message
                                                                                                    }
                                                                                                </div>
                                                                                            ),
                                                                                        )}
                                                                                    </div>
                                                                                ),
                                                                            )}
                                                                        {op
                                                                            .errors
                                                                            .length >
                                                                            10 && (
                                                                            <div className="text-sm text-danger text-center">
                                                                                ...
                                                                                and{" "}
                                                                                {op
                                                                                    .errors
                                                                                    .length -
                                                                                    10}{" "}
                                                                                more
                                                                                errors
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                        {/* Warnings */}
                                                        {op.warnings &&
                                                            op.warnings.length >
                                                                0 && (
                                                                <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                                                                    <h4 className="font-medium text-warning mb-2">
                                                                        Warnings
                                                                        (
                                                                        {
                                                                            op
                                                                                .warnings
                                                                                .length
                                                                        }
                                                                        )
                                                                    </h4>
                                                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                                                        {op.warnings
                                                                            .slice(
                                                                                0,
                                                                                5,
                                                                            )
                                                                            .map(
                                                                                (
                                                                                    warning,
                                                                                    idx,
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            idx
                                                                                        }
                                                                                        className="text-sm bg-surface p-2 rounded border border-warning/30"
                                                                                    >
                                                                                        <div className="font-medium text-warning">
                                                                                            Row{" "}
                                                                                            {
                                                                                                warning.row
                                                                                            }{" "}
                                                                                            -{" "}
                                                                                            {
                                                                                                warning.sheet
                                                                                            }
                                                                                        </div>
                                                                                        {warning.errors?.map(
                                                                                            (
                                                                                                w,
                                                                                                i,
                                                                                            ) => (
                                                                                                <div
                                                                                                    key={
                                                                                                        i
                                                                                                    }
                                                                                                    className="text-warning ml-4"
                                                                                                >
                                                                                                    •{" "}
                                                                                                    {
                                                                                                        w.message
                                                                                                    }
                                                                                                </div>
                                                                                            ),
                                                                                        )}
                                                                                    </div>
                                                                                ),
                                                                            )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                        {/* Metadata */}
                                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                                            <div>
                                                                <span className="text-text-secondary">
                                                                    Performed
                                                                    by:
                                                                </span>
                                                                <div className="font-medium">
                                                                    {op
                                                                        .performedBy
                                                                        ?.name ||
                                                                        "Unknown"}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <span className="text-text-secondary">
                                                                    Started:
                                                                </span>
                                                                <div className="font-medium">
                                                                    {op.startedAt
                                                                        ? new Date(
                                                                              op.startedAt,
                                                                          ).toLocaleString()
                                                                        : "N/A"}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <span className="text-text-secondary">
                                                                    Completed:
                                                                </span>
                                                                <div className="font-medium">
                                                                    {op.completedAt
                                                                        ? new Date(
                                                                              op.completedAt,
                                                                          ).toLocaleString()
                                                                        : "N/A"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                        <div className="text-sm text-text-secondary">
                            Showing{" "}
                            {(pagination.page - 1) * pagination.limit + 1} to{" "}
                            {Math.min(
                                pagination.page * pagination.limit,
                                pagination.total,
                            )}{" "}
                            of {pagination.total} operations
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() =>
                                    setPagination({
                                        ...pagination,
                                        page: pagination.page - 1,
                                    })
                                }
                                disabled={pagination.page === 1}
                                className="px-4 py-2 border border-border rounded-md hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>

                            <div className="flex gap-1">
                                {Array.from(
                                    { length: pagination.pages },
                                    (_, i) => i + 1,
                                )
                                    .filter(
                                        (p) =>
                                            p === 1 ||
                                            p === pagination.pages ||
                                            Math.abs(p - pagination.page) <= 1,
                                    )
                                    .map((p, idx, arr) => (
                                        <div key={idx}>
                                            {idx > 0 &&
                                                arr[idx - 1] !== p - 1 && (
                                                    <span
                                                        key={`ellipsis-${p}`}
                                                        className="px-3 py-2"
                                                    >
                                                        ...
                                                    </span>
                                                )}
                                            <button
                                                key={p}
                                                onClick={() =>
                                                    setPagination({
                                                        ...pagination,
                                                        page: p,
                                                    })
                                                }
                                                className={`px-4 py-2 border rounded-md ${
                                                    pagination.page === p
                                                        ? "bg-info text-white border-blue-600"
                                                        : "border-border hover:bg-background"
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        </div>
                                    ))}
                            </div>

                            <button
                                onClick={() =>
                                    setPagination({
                                        ...pagination,
                                        page: pagination.page + 1,
                                    })
                                }
                                disabled={pagination.page === pagination.pages}
                                className="px-4 py-2 border border-border rounded-md hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BulkOperations;
