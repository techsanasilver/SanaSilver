import express from "express";
import * as authController from "./auth.controller.js";
import authMiddleware from "../../shared/middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/send-otp", authController.sendOTP);
router.post("/verify-otp", authController.verifyOTP);
router.post("/refresh-token", authController.refreshToken);

// Protected routes
router.post("/logout", authMiddleware, authController.logout);
router.get("/profile", authMiddleware, authController.getProfile);
router.put("/profile", authMiddleware, authController.updateProfile);

export default router;
