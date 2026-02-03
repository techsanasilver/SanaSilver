import express from "express";
import * as bannerController from "./banner.controller.js";

const router = express.Router();

router.get("/", bannerController.getAllBanners);
router.get("/:id", bannerController.getBannerById);

export default router;
