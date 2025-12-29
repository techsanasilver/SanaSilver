import express from "express";
import * as adminController from "./admin.controller.js";
import authMiddleware from "../../shared/middlewares/auth.middleware.js";
import { requireRole } from "../../shared/middlewares/role.middleware.js";

const router = express.Router();

// Public routes
router.post("/login", adminController.login);
router.post("/refresh-token", adminController.refreshToken);

// Protected routes (require authentication)
router.use(authMiddleware);

router.post("/logout", adminController.logout);
router.get("/me", adminController.getMe);
router.put("/update-profile", adminController.updateProfile);
router.put("/change-password", adminController.changePassword);

// Super-admin only routes
router.post("/register", requireRole("super-admin"), adminController.register);

export default router;
