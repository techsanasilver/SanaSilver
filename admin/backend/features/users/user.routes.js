import express from "express";
import * as userController from "./user.controller.js";
import authMiddleware from "../../shared/middlewares/auth.middleware.js";
import { requirePermission } from "../../shared/middlewares/role.middleware.js";

const router = express.Router();

// ============================================================================
// USER ROUTES (All Protected)
// ============================================================================

router.get(
    "/",
    authMiddleware,
    requirePermission("users.view"),
    userController.getAllUsers,
);

router.get(
    "/:userId",
    authMiddleware,
    requirePermission("users.view"),
    userController.getUserById,
);

router.patch(
    "/:userId/toggle-status",
    authMiddleware,
    requirePermission("users.edit"),
    userController.toggleUserStatus,
);

export default router;
