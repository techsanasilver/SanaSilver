import express from "express";
import authMiddleware from "../../shared/middlewares/auth.middleware.js";
import { requirePermission } from "../../shared/middlewares/role.middleware.js";
import {
    listReviewsController,
    getReviewByIdController,
    approveReviewController,
    rejectReviewController,
    deleteReviewController,
} from "./review.controller.js";

const router = express.Router();

router.use(authMiddleware);

// GET /api/reviews
router.get("/", requirePermission("reviews.view"), listReviewsController);

// GET /api/reviews/:id
router.get("/:id", requirePermission("reviews.view"), getReviewByIdController);

// PUT /api/reviews/:id/approve
router.put(
    "/:id/approve",
    requirePermission("reviews.manage"),
    approveReviewController,
);

// PUT /api/reviews/:id/reject
router.put(
    "/:id/reject",
    requirePermission("reviews.manage"),
    rejectReviewController,
);

// DELETE /api/reviews/:id
router.delete(
    "/:id",
    requirePermission("reviews.manage"),
    deleteReviewController,
);

export default router;
