import dotenv from "dotenv";
import mongoose from "mongoose";
import Admin from "../../features/users/admin.model.js";
import connectDB from "../config/db.config.js";
import logger from "../utils/logger.util.js";

dotenv.config();

const SUPER_ADMIN_EMAIL = "admin@sansilver.com";
const SUPER_ADMIN_PASSWORD = "Admin@123";
const SUPER_ADMIN_NAME = "Super Admin";

async function seedSuperAdmin() {
    try {
        await connectDB();

        const existingAdmin = await Admin.findOne({ email: SUPER_ADMIN_EMAIL });

        if (existingAdmin) {
            logger.info(`Super admin already exists: ${SUPER_ADMIN_EMAIL}`);
            logger.info("Skipping seed operation");
            process.exit(0);
        }

        const superAdmin = await Admin.create({
            name: SUPER_ADMIN_NAME,
            email: SUPER_ADMIN_EMAIL,
            password: SUPER_ADMIN_PASSWORD,
            role: "super-admin",
            permissions: ["*"],
            isActive: true,
        });

        logger.info("====================================");
        logger.info("Super Admin Created Successfully!");
        logger.info("====================================");
        logger.info(`Name: ${superAdmin.name}`);
        logger.info(`Email: ${superAdmin.email}`);
        logger.info(`Password: ${SUPER_ADMIN_PASSWORD}`);
        logger.info(`Role: ${superAdmin.role}`);
        logger.info("====================================");
        logger.info("IMPORTANT: Change the password after first login!");
        logger.info("====================================");

        process.exit(0);
    } catch (error) {
        logger.error("Error seeding super admin:", error.message);
        process.exit(1);
    }
}

seedSuperAdmin();
