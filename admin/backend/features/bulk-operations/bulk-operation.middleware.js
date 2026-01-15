import multer from "multer";
import apiResponse from "../../shared/utils/response.util.js";
import logger from "../../shared/utils/logger.util.js";

/**
 * File size limit (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Allowed MIME types
 */
const ALLOWED_MIME_TYPES = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
];

/**
 * Allowed file extensions
 */
const ALLOWED_EXTENSIONS = [".xlsx", ".xls"];

/**
 * Multer storage configuration (memory storage)
 */
const storage = multer.memoryStorage();

/**
 * File filter
 */
const fileFilter = (req, file, cb) => {
    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        logger.warn(`Invalid file type uploaded: ${file.mimetype}`);
        return cb(
            new Error(
                "Invalid file type. Only .xlsx and .xls files are allowed."
            ),
            false
        );
    }

    // Check file extension
    const ext = file.originalname
        .toLowerCase()
        .slice(file.originalname.lastIndexOf("."));
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        logger.warn(`Invalid file extension uploaded: ${ext}`);
        return cb(
            new Error(
                "Invalid file extension. Only .xlsx and .xls files are allowed."
            ),
            false
        );
    }

    cb(null, true);
};

/**
 * Multer upload middleware
 */
export const uploadExcel = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
    fileFilter,
}).single("file");

/**
 * Error handler for multer errors
 */
export const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return apiResponse.badRequest(res, "File size exceeds 10MB limit");
        }
        return apiResponse.badRequest(res, `Upload error: ${err.message}`);
    } else if (err) {
        return apiResponse.badRequest(res, err.message);
    }
    next();
};

export default {
    uploadExcel,
    handleUploadError,
};
