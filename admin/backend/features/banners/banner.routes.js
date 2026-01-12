import express from "express";
import * as bannerController from "./banner.controller.js";
import { parseFormDataJSON } from "./banner.middleware.js";
import authMiddleware from "../../shared/middlewares/auth.middleware.js";
import { uploadMultiple } from "../../shared/middlewares/upload.middleware.js";

const router = express.Router();

// Public Routes

// Get all banners (with optional filters)
router.get("/", bannerController.getAllBanners);

// Get banner by ID
router.get("/:id", bannerController.getBannerById);

//Protected Routes (Admin Only)

// Create banner (requires 2 images: desktop and mobile)
router.post(
    "/",
    authMiddleware,
    uploadMultiple("images", 2),
    parseFormDataJSON,
    bannerController.createBanner
);

// Update banner (optional images)
router.put(
    "/:id",
    authMiddleware,
    uploadMultiple("images", 2),
    parseFormDataJSON,
    bannerController.updateBanner
);

// Soft delete banner (deactivate)
router.delete("/:id", authMiddleware, bannerController.softDeleteBanner);

// Hard delete banner (permanent)
router.delete("/:id/force", authMiddleware, bannerController.hardDeleteBanner);

// Update banner status
router.patch(
    "/:id/status",
    authMiddleware,
    bannerController.updateBannerStatus
);

// Reorder banners
router.post("/reorder", authMiddleware, bannerController.reorderBanners);

export default router;
