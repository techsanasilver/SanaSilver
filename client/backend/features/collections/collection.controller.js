import * as collectionService from "./collection.service.js";
import apiResponse from "../../shared/utils/response.util.js";
import logger from "../../shared/utils/logger.util.js";

/**
 * Get all collections
 * GET /client/collections
 */
const getAll = async (req, res) => {
    try {
        const result = await collectionService.getAllCollections();

        return apiResponse.success(
            res,
            "Collections retrieved successfully",
            result.data,
        );
    } catch (error) {
        logger.error("Get all collections error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

/**
 * Get collection details with sample products
 * GET /client/collections/:name
 */
const getByName = async (req, res) => {
    try {
        const { name } = req.params;
        const { limit = 8 } = req.query;

        const result = await collectionService.getCollectionDetails(
            name,
            parseInt(limit),
        );

        return apiResponse.success(
            res,
            "Collection details retrieved successfully",
            result.data,
        );
    } catch (error) {
        logger.error("Get collection details error:", error.message);
        return apiResponse.error(res, error.message);
    }
};

export { getAll, getByName };
