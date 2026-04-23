import express from "express";
import * as userController from "./user.controller.js";
import authMiddleware from "../../shared/middlewares/auth.middleware.js";

const router = express.Router();

// ============================================================================
// USER ROUTES (All Protected)
// ============================================================================

router.get("/", authMiddleware, userController.getAllUsers);

router.get("/:userId", authMiddleware, userController.getUserById);

router.patch(
    "/:userId/toggle-status",
    authMiddleware,
    userController.toggleUserStatus,
);

export default router;
