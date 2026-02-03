import express from "express";
import * as categoryController from "./category.controller.js";

const router = express.Router();

// Public routes
router.get("/", categoryController.getAll);
router.get("/tree", categoryController.getTree);
router.get("/slug/:slug", categoryController.getBySlug);
router.get("/:id", categoryController.getById);

export default router;
