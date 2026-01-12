/**
 * Middleware to parse FormData JSON strings for banner requests
 * Handles: link object, deleteDesktopImage, deleteMobileImage flags
 */
const parseFormDataJSON = (req, res, next) => {
    try {
        // Parse link object
        if (req.body.link && typeof req.body.link === "string") {
            try {
                req.body.link = JSON.parse(req.body.link);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid link format",
                });
            }
        }

        // Parse boolean flags
        if (req.body.isActive && typeof req.body.isActive === "string") {
            req.body.isActive = req.body.isActive === "true";
        }

        if (
            req.body.deleteDesktopImage &&
            typeof req.body.deleteDesktopImage === "string"
        ) {
            req.body.deleteDesktopImage =
                req.body.deleteDesktopImage === "true";
        }

        if (
            req.body.deleteMobileImage &&
            typeof req.body.deleteMobileImage === "string"
        ) {
            req.body.deleteMobileImage = req.body.deleteMobileImage === "true";
        }

        // Parse numeric fields
        if (req.body.sortOrder && typeof req.body.sortOrder === "string") {
            req.body.sortOrder = parseInt(req.body.sortOrder, 10);
            if (isNaN(req.body.sortOrder)) {
                delete req.body.sortOrder;
            }
        }

        // Parse date fields
        if (req.body.startDate && typeof req.body.startDate === "string") {
            if (
                req.body.startDate.trim() === "" ||
                req.body.startDate === "null"
            ) {
                delete req.body.startDate;
            }
        }

        if (req.body.endDate && typeof req.body.endDate === "string") {
            if (req.body.endDate.trim() === "" || req.body.endDate === "null") {
                delete req.body.endDate;
            }
        }

        // Clean up empty strings
        Object.keys(req.body).forEach((key) => {
            if (
                req.body[key] === "" ||
                req.body[key] === "null" ||
                req.body[key] === null
            ) {
                delete req.body[key];
            }
        });

        next();
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Error parsing form data",
            error: error.message,
        });
    }
};

export { parseFormDataJSON };
