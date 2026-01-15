import ExcelJS from "exceljs";
import logger from "../../../shared/utils/logger.util.js";

/**
 * Create a new workbook
 */
export const createWorkbook = () => {
    return new ExcelJS.Workbook();
};

/**
 * Add a worksheet to workbook
 */
export const addWorksheet = (workbook, name) => {
    return workbook.addWorksheet(name);
};

/**
 * Style header row
 */
export const styleHeaderRow = (worksheet, headerRow) => {
    headerRow.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 25;
};

/**
 * Auto-fit columns
 */
export const autoFitColumns = (worksheet) => {
    worksheet.columns.forEach((column) => {
        let maxLength = 10;
        column.eachCell?.({ includeEmpty: false }, (cell) => {
            const cellLength = cell.value ? cell.value.toString().length : 10;
            if (cellLength > maxLength) {
                maxLength = cellLength;
            }
        });
        column.width = Math.min(maxLength + 2, 50);
    });
};

/**
 * Add data validation (dropdown) to a column
 */
export const addDropdownValidation = (
    worksheet,
    column,
    rowStart,
    rowEnd,
    values
) => {
    for (let row = rowStart; row <= rowEnd; row++) {
        worksheet.getCell(`${column}${row}`).dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: [`"${values.join(",")}"`],
            showErrorMessage: true,
            errorStyle: "error",
            errorTitle: "Invalid Value",
            error: `Please select from: ${values.join(", ")}`,
        };
    }
};

/**
 * Read Excel file from buffer
 */
export const readWorkbookFromBuffer = async (buffer) => {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        return workbook;
    } catch (error) {
        logger.error("Error reading Excel file:", error);
        throw new Error(`Failed to read Excel file: ${error.message}`);
    }
};

/**
 * Get worksheet by name
 */
export const getWorksheet = (workbook, name) => {
    const worksheet = workbook.getWorksheet(name);
    if (!worksheet) {
        throw new Error(`Worksheet "${name}" not found`);
    }
    return worksheet;
};

/**
 * Parse worksheet rows to JSON
 */
export const worksheetToJSON = (worksheet, skipRows = 1) => {
    const rows = [];
    const headers = [];

    // Get headers from first row
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
        headers[colNumber] =
            cell.value?.toString().trim() || `Column${colNumber}`;
    });

    // Parse data rows
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber <= skipRows) return; // Skip header rows

        const rowData = {};
        let hasData = false;

        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const header = headers[colNumber];
            if (header) {
                const value = cell.value;

                // Handle different cell types
                if (value === null || value === undefined || value === "") {
                    rowData[header] = null;
                } else if (
                    typeof value === "object" &&
                    value.result !== undefined
                ) {
                    // Formula cell
                    rowData[header] = value.result;
                    hasData = true;
                } else {
                    rowData[header] = value;
                    hasData = true;
                }
            }
        });

        // Only add row if it has at least one non-empty cell
        if (hasData) {
            rowData._rowNumber = rowNumber;
            rows.push(rowData);
        }
    });

    return rows;
};

/**
 * Write workbook to buffer
 */
export const writeWorkbookToBuffer = async (workbook) => {
    try {
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    } catch (error) {
        logger.error("Error writing Excel file:", error);
        throw new Error(`Failed to write Excel file: ${error.message}`);
    }
};

/**
 * Validate required columns exist
 */
export const validateColumns = (actualColumns, requiredColumns) => {
    const missing = requiredColumns.filter(
        (col) => !actualColumns.includes(col)
    );
    return {
        isValid: missing.length === 0,
        missingColumns: missing,
    };
};

export default {
    createWorkbook,
    addWorksheet,
    styleHeaderRow,
    autoFitColumns,
    addDropdownValidation,
    readWorkbookFromBuffer,
    getWorksheet,
    worksheetToJSON,
    writeWorkbookToBuffer,
    validateColumns,
};
