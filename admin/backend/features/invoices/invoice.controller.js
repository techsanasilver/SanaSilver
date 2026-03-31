import * as invoiceService from "./invoice.service.js";
import { generateInvoicePDF } from "./invoice.pdf.js";
import apiResponse from "../../shared/utils/response.util.js";
import logger from "../../shared/utils/logger.util.js";

// ============================================================================
// GENERATE INVOICE
// POST /api/orders/:orderId/invoice
// ============================================================================

/**
 * Generate an invoice for an order (admin only).
 * Idempotent-ish: returns 409 with existing invoiceId if already generated.
 */
const generateInvoice = async (req, res) => {
    try {
        const { orderId } = req.params;
        const adminId = req.admin._id;

        const invoice = await invoiceService.generateInvoice(orderId, adminId);

        return apiResponse.created(res, "Invoice generated successfully", {
            invoiceId: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            orderId: invoice.order,
            orderNumber: invoice.orderNumber,
        });
    } catch (err) {
        logger.error(`Error generating invoice: ${err.message}`);
        if (err.statusCode === 404) {
            return apiResponse.notFound(res, err.message);
        }
        if (err.statusCode === 409) {
            // Return existing invoice info so UI can immediately show the download button
            return apiResponse.conflict(res, err.message);
        }
        return apiResponse.serverError(res, "Failed to generate invoice");
    }
};

// ============================================================================
// GET INVOICE STATUS FOR ORDER
// GET /api/orders/:orderId/invoice
// ============================================================================

/**
 * Return invoice metadata for a given order (does not stream PDF).
 * Used by admin UI to know whether to show Generate or Download.
 */
const getInvoiceForOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        const invoice = await invoiceService.getInvoiceByOrder(orderId);

        if (!invoice) {
            return apiResponse.success(res, "No invoice for this order", null);
        }

        return apiResponse.success(res, "Invoice found", {
            invoiceId: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            status: invoice.status,
            generatedAt: invoice.createdAt,
            downloadCount: invoice.downloadCount,
        });
    } catch (err) {
        logger.error(`Error fetching invoice for order: ${err.message}`);
        return apiResponse.serverError(res, "Failed to fetch invoice");
    }
};

// ============================================================================
// DOWNLOAD PDF (Admin)
// GET /api/invoices/:invoiceId/pdf
// ============================================================================

/**
 * Stream the invoice PDF to the client.
 * Increments downloadCount (non-blocking).
 */
const downloadInvoicePDF = async (req, res) => {
    try {
        const { invoiceId } = req.params;

        const invoice = await invoiceService.getInvoiceById(invoiceId);

        if (!invoice) {
            return apiResponse.notFound(res, "Invoice not found");
        }

        if (invoice.status === "cancelled") {
            return apiResponse.badRequest(
                res,
                "This invoice has been cancelled",
            );
        }

        const pdfBuffer = await generateInvoicePDF(invoice);

        // Fire-and-forget download count
        invoiceService.incrementDownloadCount(invoiceId);

        const filename = `Invoice-${invoice.invoiceNumber}.pdf`;
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Content-Length": pdfBuffer.length,
            "Cache-Control": "no-store",
        });

        return res.send(pdfBuffer);
    } catch (err) {
        logger.error(`Error generating PDF: ${err.message}`);
        return apiResponse.serverError(res, "Failed to generate invoice PDF");
    }
};

// ============================================================================
// CANCEL INVOICE
// PATCH /api/invoices/:invoiceId/cancel
// ============================================================================

const cancelInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const { reason } = req.body;

        const invoice = await invoiceService.cancelInvoice(invoiceId, reason);

        return apiResponse.success(res, "Invoice cancelled", {
            invoiceId: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            status: invoice.status,
        });
    } catch (err) {
        logger.error(`Error cancelling invoice: ${err.message}`);
        if (err.statusCode === 404)
            return apiResponse.notFound(res, err.message);
        if (err.statusCode === 409)
            return apiResponse.conflict(res, err.message);
        return apiResponse.serverError(res, "Failed to cancel invoice");
    }
};

export {
    generateInvoice,
    getInvoiceForOrder,
    downloadInvoicePDF,
    cancelInvoice,
};
