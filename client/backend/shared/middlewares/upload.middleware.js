import multer from "multer";
import apiResponse from "../utils/response.util.js";

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
];

// Allowed file extensions
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

// Max file sizes (in bytes)
const MAX_FILE_SIZE = {
    avatar: 2 * 1024 * 1024, // 2MB for avatars
    product: 5 * 1024 * 1024, // 5MB for products
    category: 3 * 1024 * 1024, // 3MB for categories
    default: 5 * 1024 * 1024, // 5MB default
};

/**
 * Configure Multer with memory storage
 * Files stored as Buffer in memory for direct Cloudinary upload
 */
const storage = multer.memoryStorage();

/**
 * File filter to validate image types
 */
const fileFilter = (req, file, cb) => {
    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(
            new Error(
                `Invalid file type. Only ${ALLOWED_EXTENSIONS.join(
                    ", "
                )} files are allowed`
            ),
            false
        );
    }

    // Extract file extension
    const ext = file.originalname.split(".").pop().toLowerCase();

    // Check file extension
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(
            new Error(
                `Invalid file extension. Only ${ALLOWED_EXTENSIONS.join(
                    ", "
                )} files are allowed`
            ),
            false
        );
    }

    // File is valid
    cb(null, true);
};

/**
 * Base multer configuration
 */
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || MAX_FILE_SIZE.default,
        files: parseInt(process.env.MAX_FILES_PER_UPLOAD) || 10,
    },
});

/**
 * Middleware for single image upload
 * @param {string} fieldName - Name of the form field
 * @returns {Function} Multer middleware
 *
 * Usage:
 * router.post('/avatar', uploadSingle('avatar'), controller.updateAvatar);
 */
export const uploadSingle = (fieldName) => {
    return upload.single(fieldName);
};

/**
 * Middleware for multiple images upload
 * @param {string} fieldName - Name of the form field
 * @param {number} maxCount - Maximum number of files (default: 10)
 * @returns {Function} Multer middleware
 *
 * Usage:
 * router.post('/products', uploadMultiple('images', 10), controller.create);
 */
export const uploadMultiple = (fieldName, maxCount = 10) => {
    return upload.array(fieldName, maxCount);
};

/**
 * Validation middleware for uploaded images
 * Runs after multer to perform additional checks
 * @param {object} options - Validation options
 * @param {boolean} options.required - Whether files are required
 * @param {number} options.minFiles - Minimum number of files
 * @param {number} options.maxFiles - Maximum number of files
 * @param {number} options.maxSize - Maximum file size in bytes
 * @param {string} options.uploadType - Type of upload (avatar/product/category)
 *
 * Usage:
 * router.post('/products',
 *     uploadMultiple('images', 10),
 *     validateImageUpload({ required: true, minFiles: 1, uploadType: 'product' }),
 *     controller.create
 * );
 */
export const validateImageUpload = (options = {}) => {
    const {
        required = false,
        minFiles = 0,
        maxFiles = 10,
        maxSize = null,
        uploadType = "default",
    } = options;

    return (req, res, next) => {
        try {
            // Check if files exist (for single upload)
            if (req.file) {
                req.files = [req.file]; // Normalize to array
            }

            // Check if files are required
            if (required && (!req.files || req.files.length === 0)) {
                return apiResponse.badRequest(
                    res,
                    "At least one image file is required"
                );
            }

            // If no files and not required, continue
            if (!req.files || req.files.length === 0) {
                return next();
            }

            // Check minimum files
            if (req.files.length < minFiles) {
                return apiResponse.badRequest(
                    res,
                    `At least ${minFiles} image(s) required`
                );
            }

            // Check maximum files
            if (req.files.length > maxFiles) {
                return apiResponse.badRequest(
                    res,
                    `Maximum ${maxFiles} images allowed`
                );
            }

            // Get max size for upload type
            const maxFileSize = maxSize || MAX_FILE_SIZE[uploadType];

            // Validate each file
            for (const file of req.files) {
                // Check file size
                if (file.size > maxFileSize) {
                    return apiResponse.badRequest(
                        res,
                        `Image size exceeds maximum limit of ${
                            maxFileSize / 1024 / 1024
                        }MB`
                    );
                }

                // Check MIME type (extra validation)
                if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                    return apiResponse.badRequest(
                        res,
                        `Invalid file type: ${file.originalname}`
                    );
                }

                // Check if buffer exists
                if (!file.buffer) {
                    return apiResponse.badRequest(
                        res,
                        "File upload failed. Please try again"
                    );
                }
            }

            // All validations passed
            next();
        } catch (error) {
            return apiResponse.error(
                res,
                error.message || "File validation failed"
            );
        }
    };
};

/**
 * Error handling middleware for multer errors
 * Add this to your route error handling
 */
export const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return apiResponse.badRequest(res, "File size too large");
        }
        if (err.code === "LIMIT_FILE_COUNT") {
            return apiResponse.badRequest(res, "Too many files");
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return apiResponse.badRequest(res, "Unexpected file field");
        }
        return apiResponse.badRequest(res, err.message);
    }

    if (err) {
        return apiResponse.error(res, err.message || "File upload failed");
    }

    next();
};

export default {
    uploadSingle,
    uploadMultiple,
    validateImageUpload,
    handleUploadError,
    MAX_FILE_SIZE,
};
