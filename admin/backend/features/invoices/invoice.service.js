import Invoice from "./invoice.model.js";
import Order from "../orders/order.model.js";
import logger from "../../shared/utils/logger.util.js";

// ============================================================================
// SELLER CONFIG — read from env; snapshot into invoice at generation time
// ============================================================================

const getSellerConfig = () => ({
    name: process.env.SELLER_NAME || "Sana Silver",
    gstin: process.env.SELLER_GSTIN || "",
    addressLine1: process.env.SELLER_ADDRESS_LINE1 || "",
    addressLine2: process.env.SELLER_ADDRESS_LINE2 || "",
    city: process.env.SELLER_CITY || "",
    state: process.env.SELLER_STATE || "",
    pincode: process.env.SELLER_PINCODE || "",
    email: process.env.SELLER_EMAIL || "",
    phone: process.env.SELLER_PHONE || "",
});

// ============================================================================
// GENERATE INVOICE
// ============================================================================

/**
 * Generate a new invoice for an order.
 * Throws if an active invoice already exists for this order.
 *
 * @param {string} orderId   - MongoDB Order _id
 * @param {string} adminId   - Admin _id (who triggered generation)
 * @returns {Promise<Object>} Created Invoice document
 */
const generateInvoice = async (orderId, adminId) => {
    // ── 1. Prevent duplicate invoices ──────────────────────────────────────
    const existing = await Invoice.findOne({
        order: orderId,
        status: "active",
    });
    if (existing) {
        throw Object.assign(
            new Error(
                `An active invoice already exists: ${existing.invoiceNumber}`,
            ),
            { statusCode: 409, invoiceId: existing._id },
        );
    }

    // ── 2. Load order with populated fields ────────────────────────────────
    const order = await Order.findById(orderId)
        .populate("customer", "firstName lastName email phone")
        .lean();

    if (!order) {
        throw Object.assign(new Error("Order not found"), { statusCode: 404 });
    }

    // ── 3. Build item snapshots ────────────────────────────────────────────
    const items = order.items.map((item) => ({
        productName: item.productName,
        variantName: item.variantName || null,
        sku: item.sku,
        hsn: item.hsn || "7113",
        quantity: item.quantity,
        sellingPrice: item.sellingPrice || 0,
        baseAmount: item.baseAmount || 0,
        discountBase: item.discountBase || 0,
        taxableValue: item.taxableValue ?? item.baseAmount ?? 0,
        gstRate: item.gstRate || 0,
        gstAmount: item.gstAmount || 0,
        total: item.total || 0,
    }));

    // ── 4. Compute / use existing taxSplit ─────────────────────────────────
    // If taxSplit was stored on the order, use it directly.
    // Otherwise derive from GST total (assume intra-state: CGST = SGST = gst/2).
    let taxSplit = { cgst: 0, sgst: 0, igst: 0 };
    if (order.taxSplit?.cgst || order.taxSplit?.sgst || order.taxSplit?.igst) {
        taxSplit = {
            cgst: order.taxSplit.cgst || 0,
            sgst: order.taxSplit.sgst || 0,
            igst: order.taxSplit.igst || 0,
        };
    } else {
        // Default: intra-state — split GST equally into CGST + SGST
        const half = Math.round((order.pricing.gst / 2) * 100) / 100;
        taxSplit = { cgst: half, sgst: order.pricing.gst - half, igst: 0 };
    }

    // ── 5. Build customer snapshot ─────────────────────────────────────────
    const customer = order.customer;
    const customerName = customer
        ? [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
          null
        : null;

    const customerSnapshot = {
        name: customerName,
        phone: customer?.phone || order.shippingAddress.phone,
        email: customer?.email || null,
    };

    // ── 6. Generate sequential invoice number ─────────────────────────────
    const { invoiceNumber, financialYear } =
        await Invoice.generateInvoiceNumber();

    // ── 7. Create and persist ──────────────────────────────────────────────
    const invoice = new Invoice({
        invoiceNumber,
        financialYear,
        order: order._id,
        orderNumber: order.orderNumber,
        customer: order.customer?._id || order.customer,
        generatedBy: adminId,
        customerSnapshot,
        billingAddress: order.billingAddress,
        shippingAddress: order.shippingAddress,
        items,
        pricing: {
            itemsSubtotal: order.pricing.itemsSubtotal,
            discount: order.pricing.discount || 0,
            discountedSubtotal:
                order.pricing.discountedSubtotal ?? order.pricing.itemsSubtotal,
            shippingCharges: order.pricing.shippingCharges || 0,
            taxableAmount:
                order.pricing.taxableAmount || order.pricing.itemsSubtotal,
            gst: order.pricing.gst,
            total: order.pricing.total,
        },
        taxSplit,
        appliedCoupon: order.appliedCoupon
            ? {
                  code: order.appliedCoupon.code,
                  discountType: order.appliedCoupon.discountType,
                  discountValue: order.appliedCoupon.discountValue,
                  discountAmount: order.appliedCoupon.discountAmount,
              }
            : undefined,
        paymentMethod: order.payment.method,
        paymentStatus: order.payment.status,
        seller: getSellerConfig(),
    });

    await invoice.save();
    logger.info(
        `Invoice generated: ${invoiceNumber} for order ${order.orderNumber}`,
    );

    return invoice;
};

// ============================================================================
// GET INVOICE BY ORDER
// ============================================================================

/**
 * Get the active invoice for an order (returns null if none exists).
 * @param {string} orderId
 * @returns {Promise<Object|null>}
 */
const getInvoiceByOrder = async (orderId) => {
    return Invoice.findOne({ order: orderId, status: "active" }).lean();
};

/**
 * Get invoice by its own ID.
 * @param {string} invoiceId
 * @returns {Promise<Object|null>}
 */
const getInvoiceById = async (invoiceId) => {
    return Invoice.findById(invoiceId).lean();
};

// ============================================================================
// CANCEL INVOICE
// ============================================================================

/**
 * Cancel an active invoice (e.g. when order is fully refunded).
 * @param {string} invoiceId
 * @param {string} reason
 * @returns {Promise<Object>} Updated invoice
 */
const cancelInvoice = async (invoiceId, reason) => {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
        throw Object.assign(new Error("Invoice not found"), {
            statusCode: 404,
        });
    }
    if (invoice.status === "cancelled") {
        throw Object.assign(new Error("Invoice is already cancelled"), {
            statusCode: 409,
        });
    }

    invoice.status = "cancelled";
    invoice.cancelledAt = new Date();
    invoice.cancelReason = reason || "Cancelled by admin";
    await invoice.save();

    logger.info(`Invoice cancelled: ${invoice.invoiceNumber}`);
    return invoice;
};

// ============================================================================
// INCREMENT DOWNLOAD COUNT
// ============================================================================

/**
 * Bump downloadCount — fire-and-forget, non-blocking.
 * @param {string} invoiceId
 */
const incrementDownloadCount = (invoiceId) => {
    Invoice.findByIdAndUpdate(invoiceId, { $inc: { downloadCount: 1 } }).catch(
        (err) =>
            logger.warn(
                `Failed to increment download count for ${invoiceId}: ${err.message}`,
            ),
    );
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
    generateInvoice,
    getInvoiceByOrder,
    getInvoiceById,
    cancelInvoice,
    incrementDownloadCount,
};
