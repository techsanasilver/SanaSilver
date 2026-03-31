/**
 * invoice.controller.js (client backend)
 *
 * Exposes a single endpoint so authenticated customers can download the PDF
 * invoice for their own orders.
 *
 * Route: GET /api/orders/:orderId/invoice
 */

import Invoice from "./invoice.model.js";
import { generateInvoicePDF } from "./invoice.pdf.js";
import * as orderService from "../orders/order.service.js";
import apiResponse from "../../shared/utils/response.util.js";
import logger from "../../shared/utils/logger.util.js";

// ============================================================================
// DOWNLOAD INVOICE PDF
// ============================================================================

/**
 * GET /api/orders/:orderId/invoice
 * Streams the tax-invoice PDF for the caller's own order.
 * Returns HTTP 404 (JSON) if no active invoice exists.
 */
export const downloadInvoicePDF = async (req, res) => {
    try {
        const { orderId } = req.params;
        const customerId = req.user.userId;

        // ── 1. Verify order exists and belongs to this customer ───────────────
        let order;
        try {
            order = await orderService.getOrderById(orderId);
        } catch {
            return apiResponse.notFound(res, "Order not found");
        }

        if (order.customer._id.toString() !== customerId.toString()) {
            logger.warn(
                `Unauthorized invoice access: user ${customerId} → order ${orderId}`,
            );
            return apiResponse.forbidden(
                res,
                "You don't have access to this order",
            );
        }

        // ── 2. Find the active invoice for this order ─────────────────────────
        const invoice = await Invoice.findOne({
            order: orderId,
            status: "active",
        }).lean();

        if (!invoice) {
            return apiResponse.notFound(
                res,
                "Invoice not yet available for this order",
            );
        }

        // ── 3. Generate PDF buffer ─────────────────────────────────────────────
        const pdfBuffer = await generateInvoicePDF(invoice);

        // ── 4. Fire-and-forget download count increment ───────────────────────
        Invoice.updateOne({ _id: invoice._id }, { $inc: { downloadCount: 1 } })
            .exec()
            .catch((err) =>
                logger.warn(`downloadCount increment failed: ${err.message}`),
            );

        // ── 5. Send PDF ────────────────────────────────────────────────────────
        const filename = `Invoice-${invoice.invoiceNumber}.pdf`;
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Content-Length": pdfBuffer.length,
            "Cache-Control": "no-store",
        });
        return res.send(pdfBuffer);
    } catch (error) {
        logger.error(`Error generating invoice PDF: ${error.message}`);
        return apiResponse.serverError(res, "Failed to generate invoice");
    }
};
