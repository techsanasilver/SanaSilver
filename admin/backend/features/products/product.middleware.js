/**
 * Middleware to parse JSON string fields from FormData before validation
 */
export const parseFormDataJSON = (req, res, next) => {
    try {
        // Parse variants if it's a string
        if (req.body.variants && typeof req.body.variants === "string") {
            try {
                req.body.variants = JSON.parse(req.body.variants);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid variants format",
                    errors: ["variants must be valid JSON"],
                });
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
        if (
            req.body.deleteImages &&
            typeof req.body.deleteImages === "string"
        ) {
            try {
                req.body.deleteImages = JSON.parse(req.body.deleteImages);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid deleteImages format",
                    errors: ["deleteImages must be valid JSON"],
                });
            }
        }

        // Parse deleteVariants if it's a string
        if (
            req.body.deleteVariants &&
            typeof req.body.deleteVariants === "string"
        ) {
            try {
                req.body.deleteVariants = JSON.parse(req.body.deleteVariants);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid deleteVariants format",
                    errors: ["deleteVariants must be valid JSON"],
                });
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
