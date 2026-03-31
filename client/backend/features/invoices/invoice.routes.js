/**
 * invoice.routes.js (client backend)
 *
 * Mounts at /api via server.js:
 *   app.use("/api", invoiceRoutes)
 *
 * Routes:
 *   GET  /orders/:orderId/invoice   — Download PDF invoice (customer auth)
 */

import express from "express";
import { downloadInvoicePDF } from "./invoice.controller.js";
import authMiddleware from "../../shared/middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @route   GET /api/orders/:orderId/invoice
 * @desc    Download tax-invoice PDF for the authenticated customer's order
 * @access  Protected (customer must own the order)
 */
router.get("/orders/:orderId/invoice", authMiddleware, downloadInvoicePDF);

export default router;
