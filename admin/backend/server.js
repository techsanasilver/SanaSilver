import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

// Import utilities and middleware
import logger from "./shared/utils/logger.util.js";
import errorHandler from "./shared/middlewares/error.middleware.js";
import connectDB from "./shared/config/db.config.js";

// Import feature routes
import adminRoutes from "./features/auth/admin.routes.js";
import categoryRoutes from "./features/categories/category.routes.js";
import productRoutes from "./features/products/product.routes.js";
import bannerRoutes from "./features/banners/banner.routes.js";
import bulkOperationsRoutes from "./features/bulk-operations/bulk-operation.routes.js";
import couponRoutes from "./features/coupons/coupon.routes.js";
// Add more feature route imports here as you create them

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(
    cors({
        origin: process.env.CORS_ORIGIN || "http://localhost:5000",
        credentials: true,
    }),
);

// Body parsing middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Health check route
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        message: "Sana Silver Admin Backend is running",
        timestamp: new Date().toISOString(),
    });
});

// Feature-based API routes
app.use("/api/auth", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/bulk-operations", bulkOperationsRoutes);
app.use("/api/coupons", couponRoutes);
// Add more feature routes here as you create them

// Global error handler (must be last)
app.use(errorHandler);

// Database connection and server start
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
            logger.info(
                `Environment: ${process.env.NODE_ENV || "development"}`,
            );
        });
    })
    .catch((error) => {
        logger.error("Failed to start server:", error.message);
        process.exit(1);
    });
