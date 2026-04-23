import * as userService from "./user.service.js";
import apiResponse from "../../shared/utils/response.util.js";
import logger from "../../shared/utils/logger.util.js";

// ============================================================================
// GET ALL USERS
// ============================================================================

const getAllUsers = async (req, res) => {
    try {
        const { page, limit, search, isActive, sortBy } = req.query;

        const filters = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            search: search || null,
            isActive:
                isActive === "true"
                    ? true
                    : isActive === "false"
                      ? false
                      : null,
            sortBy: sortBy || "newest",
        };

        const result = await userService.getAllUsers(filters);

        return apiResponse.successWithPagination(
            res,
            "Customers retrieved successfully",
            result.users,
            result.pagination,
        );
    } catch (error) {
        logger.error(`Error fetching customers: ${error.message}`);
        return apiResponse.serverError(res, "Failed to fetch customers");
    }
};

// ============================================================================
// GET USER BY ID
// ============================================================================

const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await userService.getUserById(userId);

        return apiResponse.success(
            res,
            "Customer retrieved successfully",
            result,
        );
    } catch (error) {
        logger.error(
            `Error fetching customer ${req.params.userId}: ${error.message}`,
        );
        if (error.message === "Customer not found") {
            return apiResponse.notFound(res, "Customer not found");
        }
        return apiResponse.serverError(res, "Failed to fetch customer");
    }
};

// ============================================================================
// TOGGLE USER STATUS
// ============================================================================

const toggleUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await userService.toggleUserStatus(userId);

        return apiResponse.success(
            res,
            `Customer ${result.isActive ? "activated" : "deactivated"} successfully`,
            result,
        );
    } catch (error) {
        logger.error(
            `Error toggling customer status ${req.params.userId}: ${error.message}`,
        );
        if (error.message === "Customer not found") {
            return apiResponse.notFound(res, "Customer not found");
        }
        return apiResponse.serverError(res, "Failed to update customer status");
    }
};

export { getAllUsers, getUserById, toggleUserStatus };
