import express from "express";
import {
    getAllProductsController,
    getProductByIdController,
    getProductBySlugController,
    getVariantByIdController,
    getProductVariantsController,
} from "./product.controller.js";

const router = express.Router();

router.get("/", getAllProductsController);
router.get("/slug/:slug", getProductBySlugController);
router.get("/:id", getProductByIdController);

router.get("/:productId/variants", getProductVariantsController);
router.get("/variants/:variantId", getVariantByIdController);

export default router;
