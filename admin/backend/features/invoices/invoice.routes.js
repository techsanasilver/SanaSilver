import express from "express";
import * as invoiceController from "./invoice.controller.js";
import authMiddleware from "../../shared/middlewares/auth.middleware.js";
import { requirePermission } from "../../shared/middlewares/role.middleware.js";

const router = express.Router();

// ============================================================================
// INVOICE ROUTES (Admin — all protected)
// ============================================================================

/**
 * @route   POST /api/orders/:orderId/invoice
 * @desc    Generate invoice for an order (admin only)
 * @access  Admin (orders.manage)
 * Note:    Mounted on the order router (see order.routes.js addition),
 *          but also referenced here for standalone mounting.
 */
router.post(
    "/orders/:orderId/invoice",
    authMiddleware,
    requirePermission("orders.manage"),
    invoiceController.generateInvoice,
);

/**
 * @route   GET /api/orders/:orderId/invoice
 * @desc    Get invoice metadata for a given order (exists / not)
 * @access  Admin (orders.view)
 */
router.get(
    "/orders/:orderId/invoice",
    authMiddleware,
    requirePermission("orders.view"),
    invoiceController.getInvoiceForOrder,
);

/**
 * @route   GET /api/invoices/:invoiceId/pdf
 * @desc    Download invoice as PDF
 * @access  Admin (orders.view)
 */
router.get(
    "/invoices/:invoiceId/pdf",
    authMiddleware,
    requirePermission("orders.view"),
    invoiceController.downloadInvoicePDF,
);

/**
 * @route   PATCH /api/invoices/:invoiceId/cancel
 * @desc    Cancel an invoice
 * @access  Admin (orders.manage)
 */
router.patch(
    "/invoices/:invoiceId/cancel",
    authMiddleware,
    requirePermission("orders.manage"),
    invoiceController.cancelInvoice,
);

export default router;
