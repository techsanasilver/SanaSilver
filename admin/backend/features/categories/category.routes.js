import express from "express";
import * as categoryController from "./category.controller.js";
import authMiddleware from "../../shared/middlewares/auth.middleware.js";
import {
    requirePermission,
    requireRole,
} from "../../shared/middlewares/role.middleware.js";
import {
    uploadSingle,
    validateImageUpload,
} from "../../shared/middlewares/upload.middleware.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/", categoryController.getAll);
router.get("/tree", categoryController.getTree);
router.get("/slug/:slug", categoryController.getBySlug);

// Protected routes (authentication required)
// Get single category by ID
router.get(
    "/:id",
    authMiddleware,
    requirePermission("categories.view"),
    categoryController.getById
);

// Create category
router.post(
    "/",
    authMiddleware,
    requirePermission("categories.create"),
    uploadSingle("image"),
    validateImageUpload({
        required: false,
        uploadType: "category",
    }),
    categoryController.create
);

// Update category (handles text fields + optional image)
router.put(
    "/:id",
    authMiddleware,
    requirePermission("categories.edit"),
    uploadSingle("image"),
    validateImageUpload({
        required: false,
        uploadType: "category",
    }),
    categoryController.update
);

// Upload/update category image
router.put(
    "/:id/image",
    authMiddleware,
    requirePermission("categories.edit"),
    uploadSingle("image"),
    validateImageUpload({
        required: true,
        uploadType: "category",
    }),
    categoryController.uploadImage
);

// Remove category image
router.delete(
    "/:id/image",
    authMiddleware,
    requirePermission("categories.edit"),
    categoryController.deleteImage
);

// Toggle category status
router.patch(
    "/:id/status",
    authMiddleware,
    requirePermission("categories.edit"),
    categoryController.toggleStatus
);

// Update sort order
router.patch(
    "/:id/reorder",
    authMiddleware,
    requirePermission("categories.edit"),
    categoryController.reorder
);

// Soft delete category
router.delete(
    "/:id",
    authMiddleware,
    requireRole("admin", "super-admin"),
    categoryController.softDelete
);

// Hard delete category (permanent)
router.delete(
    "/:id/force",
    authMiddleware,
    requireRole("super-admin"),
    categoryController.hardDelete
);

export default router;
