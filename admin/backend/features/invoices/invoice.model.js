import mongoose from "mongoose";

// ============================================================================
// COUNTER SCHEMA — sequential invoice number per financial year
// ============================================================================

const invoiceCounterSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // e.g. "invoice_2526" (FY 25-26)
    seq: { type: Number, default: 0 },
});

const InvoiceCounter = mongoose.model(
    "InvoiceCounter",
    invoiceCounterSchema,
    "invoicecounters",
);

// ============================================================================
// INVOICE SCHEMA
// ============================================================================

/**
 * Invoice item — frozen snapshot at generation time.
 * Mirrors order item fields so the invoice can be reconstructed without
 * touching the live order document.
 */
const invoiceItemSchema = new mongoose.Schema(
    {
        productName: { type: String, required: true },
        variantName: { type: String },
        sku: { type: String, required: true },
        hsn: { type: String, default: "7113" }, // HSN for jewellery (imitation)
        quantity: { type: Number, required: true, min: 1 },
        sellingPrice: { type: Number, required: true, min: 0 }, // GST-inclusive per unit
        baseAmount: { type: Number, required: true, min: 0 }, // pre-GST line total
        discountBase: { type: Number, default: 0, min: 0 }, // pre-GST discount share
        taxableValue: { type: Number, required: true, min: 0 }, // baseAmount - discountBase
        gstRate: { type: Number, required: true, min: 0 },
        gstAmount: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 }, // taxableValue + gstAmount
    },
    { _id: false },
);

const addressSnapshotSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        line1: { type: String, required: true },
        line2: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        country: { type: String, default: "India" },
    },
    { _id: false },
);

const invoiceSchema = new mongoose.Schema(
    {
        // ── Identity ────────────────────────────────────────────────────────
        invoiceNumber: {
            type: String,
            required: true,
            unique: true,
            // e.g. INV-2526-00001
        },
        financialYear: {
            type: String,
            required: true,
            // e.g. "2526" → April 2025–March 2026
        },

        // ── References ──────────────────────────────────────────────────────
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            unique: true, // one active invoice per order
        },
        orderNumber: {
            type: String,
            required: true,
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        generatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            required: true,
        },

        // ── Frozen snapshots — never mutated after creation ─────────────────
        customerSnapshot: {
            name: { type: String }, // firstName + lastName at generation time
            phone: { type: String },
            email: { type: String },
        },

        billingAddress: {
            type: addressSnapshotSchema,
            required: true,
        },
        shippingAddress: {
            type: addressSnapshotSchema,
            required: true,
        },

        items: {
            type: [invoiceItemSchema],
            required: true,
            validate: {
                validator: (arr) => arr.length > 0,
                message: "Invoice must have at least one item",
            },
        },

        pricing: {
            itemsSubtotal: { type: Number, required: true, min: 0 },
            discount: { type: Number, default: 0, min: 0 },
            discountedSubtotal: { type: Number, min: 0 },
            shippingCharges: { type: Number, default: 0, min: 0 },
            taxableAmount: { type: Number, required: true, min: 0 },
            gst: { type: Number, required: true, min: 0 },
            total: { type: Number, required: true, min: 0 },
        },

        // CGST + SGST (intra-state) or IGST (inter-state)
        taxSplit: {
            cgst: { type: Number, default: 0, min: 0 },
            sgst: { type: Number, default: 0, min: 0 },
            igst: { type: Number, default: 0, min: 0 },
        },

        appliedCoupon: {
            code: { type: String },
            discountType: { type: String },
            discountValue: { type: Number },
            discountAmount: { type: Number },
        },

        paymentMethod: {
            type: String,
            enum: ["razorpay", "cod", "wallet"],
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed", "refunded"],
            required: true,
        },

        // ── Seller info (snapshot so invoice stays valid if config changes) ─
        seller: {
            name: { type: String, required: true },
            gstin: { type: String },
            addressLine1: { type: String },
            addressLine2: { type: String },
            city: { type: String },
            state: { type: String },
            pincode: { type: String },
            email: { type: String },
            phone: { type: String },
        },

        // ── Lifecycle ───────────────────────────────────────────────────────
        status: {
            type: String,
            enum: ["active", "cancelled"],
            default: "active",
        },
        cancelledAt: { type: Date },
        cancelReason: { type: String },

        downloadCount: { type: Number, default: 0 },
    },
    { timestamps: true },
);

// ── Indexes ──────────────────────────────────────────────────────────────────
invoiceSchema.index({ order: 1 });
invoiceSchema.index({ customer: 1 });
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ createdAt: -1 });

// ============================================================================
// STATIC: generate next sequential invoice number (atomic)
// ============================================================================

invoiceSchema.statics.generateInvoiceNumber = async function () {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();

    // Financial year: April (month 4) starts the new FY
    // FY 2025-26 → "2526", FY 2026-27 → "2627"
    const fyStartYear = month >= 4 ? year : year - 1;
    const fyEndYear = fyStartYear + 1;
    const fy = `${String(fyStartYear).slice(-2)}${String(fyEndYear).slice(-2)}`;

    const counterId = `invoice_${fy}`;

    const counter = await InvoiceCounter.findByIdAndUpdate(
        counterId,
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
    );

    const paddedSeq = String(counter.seq).padStart(5, "0");
    return { invoiceNumber: `INV-${fy}-${paddedSeq}`, financialYear: fy };
};

const Invoice = mongoose.model("Invoice", invoiceSchema);

export { InvoiceCounter };
export default Invoice;
