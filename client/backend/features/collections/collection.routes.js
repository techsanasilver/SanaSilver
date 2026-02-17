import express from "express";
import * as collectionController from "./collection.controller.js";

const router = express.Router();

// Public routes
router.get("/", collectionController.getAll);
router.get("/:name", collectionController.getByName);

export default router;
