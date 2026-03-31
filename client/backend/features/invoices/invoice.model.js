/**
 * invoice.model.js (client backend — read-only)
 *
 * Minimal Invoice model pointing to the same `invoices` collection that the
 * admin backend writes to.  Both backends connect to the same MongoDB database
 * (SanaSilver), so Mongoose will query the exact same documents.
 *
 * This client-side model is intentionally schemaless (strict: false) to avoid
 * duplicating the full schema — the client only reads and never writes.
 */

import mongoose from "mongoose";

// Minimal schema — only defines the fields we query on so Mongoose casts them
// correctly (ObjectId, string). All other stored fields are returned via
// strict: false without validation.
const invoiceSchema = new mongoose.Schema(
    {
        order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
        status: { type: String },
    },
    {
        strict: false, // return every stored field, not just the two above
        collection: "invoices", // same collection as admin backend
    },
);

// Prevent OverwriteModelError when the module is hot-reloaded
const Invoice =
    mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);

export default Invoice;
