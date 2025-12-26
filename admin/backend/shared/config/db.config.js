/**
 * Database Configuration
 * MongoDB connection setup with Mongoose
 */

import mongoose from "mongoose";
import logger from "../utils/logger.util.js";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // These options are now deprecated in Mongoose 6+
            // but keeping structure for reference
        });

        logger.info(`MongoDB Connected: ${conn.connection.name}`);
        return conn;
    } catch (error) {
        logger.error("MongoDB connection error:", error.message);
        process.exit(1);
    }
};

export default connectDB;
