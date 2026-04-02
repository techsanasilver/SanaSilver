import express from "express";
import authMiddleware from "../../shared/middlewares/auth.middleware.js";
import {
    getProductReviewsController,
    canReviewController,
    getMyReviewsController,
    submitReviewController,
    editReviewController,
    deleteReviewController,
} from "./review.controller.js";

const router = express.Router();

// ─── Public ───────────────────────────────────────────────────────────────────

// GET /api/products/:productId/reviews
router.get("/products/:productId/reviews", getProductReviewsController);

// ─── Protected ────────────────────────────────────────────────────────────────

// GET /api/reviews/can-review/:productId  – must come before /:id
router.get(
    "/reviews/can-review/:productId",
    authMiddleware,
    canReviewController,
);

// GET /api/reviews/my
router.get("/reviews/my", authMiddleware, getMyReviewsController);

// POST /api/reviews
router.post("/reviews", authMiddleware, submitReviewController);

// PUT /api/reviews/:id
router.put("/reviews/:id", authMiddleware, editReviewController);

// DELETE /api/reviews/:id
router.delete("/reviews/:id", authMiddleware, deleteReviewController);

export default router;
