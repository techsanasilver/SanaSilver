/**
 * Middleware to parse JSON string fields from FormData before validation
 */
export const parseFormDataJSON = (req, res, next) => {
    try {
        // Parse variants if it's a string (and not empty)
        if (req.body.variants !== undefined) {
            if (req.body.variants === "" || req.body.variants === null) {
                // Remove the field if it's empty or null
                delete req.body.variants;
            } else if (typeof req.body.variants === "string") {
                try {
                    const parsed = JSON.parse(req.body.variants);
                    // Only set if it's a non-empty array
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        req.body.variants = parsed;
                    } else {
                        // Remove empty arrays
                        delete req.body.variants;
                    }
                } catch (e) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid variants format",
                        errors: ["variants must be valid JSON"],
                    });
                }
            } else if (
                Array.isArray(req.body.variants) &&
                req.body.variants.length === 0
            ) {
                // Remove if already an empty array
                delete req.body.variants;
            }
        }

        // Parse tags if it's a string
        if (req.body.tags && typeof req.body.tags === "string") {
            try {
                req.body.tags = JSON.parse(req.body.tags);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid tags format",
                    errors: ["tags must be valid JSON"],
                });
            }
        }

        // Parse collections if it's a string
        if (req.body.collections && typeof req.body.collections === "string") {
            try {
                req.body.collections = JSON.parse(req.body.collections);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid collections format",
                    errors: ["collections must be valid JSON"],
                });
            }
        }

        // Parse attributes if it's a string
        if (req.body.attributes && typeof req.body.attributes === "string") {
            try {
                req.body.attributes = JSON.parse(req.body.attributes);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid attributes format",
                    errors: ["attributes must be valid JSON"],
                });
            }
        }

        // Parse hallmark if it's a string
        if (req.body.hallmark && typeof req.body.hallmark === "string") {
            try {
                req.body.hallmark = JSON.parse(req.body.hallmark);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid hallmark format",
                    errors: ["hallmark must be valid JSON"],
                });
            }
        }

        // Parse seo if it's a string
        if (req.body.seo && typeof req.body.seo === "string") {
            try {
                req.body.seo = JSON.parse(req.body.seo);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid seo format",
                    errors: ["seo must be valid JSON"],
                });
            }
        }

        // Parse deleteImages if it's a string
        if (req.body.deleteImages !== undefined) {
            if (
                req.body.deleteImages === "" ||
                req.body.deleteImages === null
            ) {
                delete req.body.deleteImages;
            } else if (typeof req.body.deleteImages === "string") {
                try {
                    const parsed = JSON.parse(req.body.deleteImages);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        req.body.deleteImages = parsed;
                    } else {
                        delete req.body.deleteImages;
                    }
                } catch (e) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid deleteImages format",
                        errors: ["deleteImages must be valid JSON"],
                    });
                }
            } else if (
                Array.isArray(req.body.deleteImages) &&
                req.body.deleteImages.length === 0
            ) {
                delete req.body.deleteImages;
            }
        }

        // Parse deleteVariants if it's a string
        if (req.body.deleteVariants !== undefined) {
            if (
                req.body.deleteVariants === "" ||
                req.body.deleteVariants === null
            ) {
                delete req.body.deleteVariants;
            } else if (typeof req.body.deleteVariants === "string") {
                try {
                    const parsed = JSON.parse(req.body.deleteVariants);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        req.body.deleteVariants = parsed;
                    } else {
                        delete req.body.deleteVariants;
                    }
                } catch (e) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid deleteVariants format",
                        errors: ["deleteVariants must be valid JSON"],
                    });
                }
            } else if (
                Array.isArray(req.body.deleteVariants) &&
                req.body.deleteVariants.length === 0
            ) {
                delete req.body.deleteVariants;
            }
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error parsing form data",
        });
    }
};
