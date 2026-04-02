import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

// Import utilities and middleware
import logger from "./shared/utils/logger.util.js";
import errorHandler from "./shared/middlewares/error.middleware.js";
import connectDB from "./shared/config/db.config.js";

// Import feature routes
import authRoutes from "./features/auth/auth.routes.js";
import categoryRoutes from "./features/categories/category.routes.js";
import productRoutes from "./features/products/product.routes.js";
import bannerRoutes from "./features/banners/banner.routes.js";
import collectionRoutes from "./features/collections/collection.routes.js";
import cartRoutes from "./features/cart/cart.routes.js";
import wishlistRoutes from "./features/wishlist/wishlist.routes.js";
import orderRoutes from "./features/orders/order.routes.js";
import checkoutRoutes from "./features/checkout/checkout.routes.js";
import couponRoutes from "./features/coupons/coupon.routes.js";
import invoiceRoutes from "./features/invoices/invoice.routes.js";
import reviewRoutes from "./features/reviews/review.routes.js";
// Add more feature route imports here as you create them

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Security middleware
app.use(
    cors({
        origin: process.env.CORS_ORIGIN || "http://localhost:5174",
        credentials: true,
    }),
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
    logger.info(`Requesting: ${req.method} ${req.originalUrl}`);
    next();
});

// Health check route
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        message: "Sana Silver Client Backend is running",
        timestamp: new Date().toISOString(),
    });
});

// Feature-based API routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api", invoiceRoutes);
app.use("/api", reviewRoutes);
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
