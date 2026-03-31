/**
 * invoice.pdf.js
 * Generates a GST-compliant tax invoice PDF using PDFKit.
 * Streams the PDF buffer — do NOT write to disk.
 *
 * Usage:
 *   import { generateInvoicePDF } from "./invoice.pdf.js";
 *   const pdfBuffer = await generateInvoicePDF(invoiceDoc);
 *   res.set({ "Content-Type": "application/pdf", ... });
 *   res.send(pdfBuffer);
 */

import PDFDocument from "pdfkit";

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = {
    // Header strip — dark inverted (background-invert)
    headerBg: "#2a2a2a", // background-invert
    headerText: "#faf8f5", // text-primary-invert
    headerSubtext: "#bfbebb", // text-secondary-invert  (dimmed seller details)

    // Table header rows — brand sage as accent bg
    tableHeader: "#8b9a8d", // accent-1 (sage green)
    tableHeaderText: "#faf8f5", // light text on sage

    // Table body
    tableBorder: "#e0dbd7", // --color-divider
    tableRowAlt: "#f5f3f0", // warm off-white zebra row

    // Body text
    textPrimary: "#2a2a2a", // --color-text-primary
    textSecondary: "#6a6a6a", // --color-text-secondary
    textMuted: "#6a6a6a", // same as text-secondary

    // Accents & separators
    accent: "#8b9a8d", // accent-1 — "TAX INVOICE" label, section headings
    black: "#2a2a2a", // total separator line
    divider: "#e0dbd7", // --color-divider

    // Status
    success: "#27ae60", // --color-success
};

const FONT = {
    regular: "Helvetica",
    bold: "Helvetica-Bold",
    oblique: "Helvetica-Oblique",
};

const MARGIN = { top: 40, left: 40, right: 40, bottom: 40 };
const PAGE_WIDTH = 595.28; // A4
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN.left - MARGIN.right;

// ============================================================================
// HELPERS
// ============================================================================

const formatPrice = (amount) => {
    const n = Number(amount) || 0;
    // PDFKit's built-in fonts don't support the ₹ glyph — use "Rs." instead
    return (
        "Rs. " +
        new Intl.NumberFormat("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(n)
    );
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

/**
 * Convert number to Indian words (for "amount in words" line).
 * Handles amounts up to 99,99,999 (∼1 crore).
 */
const numberToWords = (num) => {
    const a = [
        "",
        "One",
        "Two",
        "Three",
        "Four",
        "Five",
        "Six",
        "Seven",
        "Eight",
        "Nine",
        "Ten",
        "Eleven",
        "Twelve",
        "Thirteen",
        "Fourteen",
        "Fifteen",
        "Sixteen",
        "Seventeen",
        "Eighteen",
        "Nineteen",
    ];
    const b = [
        "",
        "",
        "Twenty",
        "Thirty",
        "Forty",
        "Fifty",
        "Sixty",
        "Seventy",
        "Eighty",
        "Ninety",
    ];

    const twoDigits = (n) => {
        if (n < 20) return a[n];
        return (b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "")).trim();
    };

    const threeDigits = (n) => {
        if (n === 0) return "";
        if (n < 100) return twoDigits(n);
        return (
            a[Math.floor(n / 100)] +
            " Hundred" +
            (n % 100 ? " and " + twoDigits(n % 100) : "")
        );
    };

    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);

    let words = "";
    const crore = Math.floor(rupees / 10000000);
    const lakh = Math.floor((rupees % 10000000) / 100000);
    const thousand = Math.floor((rupees % 100000) / 1000);
    const remainder = rupees % 1000;

    if (crore) words += threeDigits(crore) + " Crore ";
    if (lakh) words += threeDigits(lakh) + " Lakh ";
    if (thousand) words += threeDigits(thousand) + " Thousand ";
    if (remainder) words += threeDigits(remainder);

    words = words.trim();
    if (!words) words = "Zero";
    words = "Rupees " + words;
    if (paise) words += " and " + twoDigits(paise) + " Paise";
    return words + " Only";
};

// ============================================================================
// PDF BUILDER
// ============================================================================

/**
 * Build a horizontal rule
 */
const hRule = (doc, y, color = COLORS.divider, width = CONTENT_WIDTH) => {
    doc.moveTo(MARGIN.left, y)
        .lineTo(MARGIN.left + width, y)
        .strokeColor(color)
        .lineWidth(0.5)
        .stroke();
};

/**
 * Draw a filled rectangle (used for header and table header rows)
 */
const fillRect = (doc, x, y, w, h, color) => {
    doc.rect(x, y, w, h).fillColor(color).fill();
};

// ============================================================================
// SECTION RENDERERS
// ============================================================================

/**
 * Header block: company name, GSTIN, contact | Invoice title, number, date
 */
const renderHeader = (doc, invoice) => {
    const y = MARGIN.top;
    const blockH = 80;

    // Dark background strip
    fillRect(doc, MARGIN.left, y, CONTENT_WIDTH, blockH, COLORS.headerBg);

    // Left: Seller info
    doc.font(FONT.bold)
        .fontSize(18)
        .fillColor(COLORS.headerText)
        .text(invoice.seller.name || "Sana Silver", MARGIN.left + 12, y + 12);

    const sellerLines = [
        invoice.seller.gstin ? `GSTIN: ${invoice.seller.gstin}` : null,
        [invoice.seller.addressLine1, invoice.seller.city]
            .filter(Boolean)
            .join(", ") || null,
        invoice.seller.phone || null,
        invoice.seller.email || null,
    ].filter(Boolean);

    doc.font(FONT.regular).fontSize(7.5).fillColor(COLORS.headerSubtext);
    sellerLines.forEach((line, i) => {
        doc.text(line, MARGIN.left + 12, y + 34 + i * 10);
    });

    // Right: TAX INVOICE label + number/date
    const rightX = MARGIN.left + CONTENT_WIDTH / 2 + 10;
    doc.font(FONT.bold)
        .fontSize(13)
        .fillColor(COLORS.accent)
        .text("TAX INVOICE", rightX, y + 12, {
            width: CONTENT_WIDTH / 2 - 12,
            align: "right",
        });

    doc.font(FONT.regular).fontSize(8).fillColor(COLORS.headerText);

    const rightLines = [
        `Invoice No.: ${invoice.invoiceNumber}`,
        `Order No.: ${invoice.orderNumber}`,
        `Date: ${formatDate(invoice.createdAt)}`,
        `Payment: ${invoice.paymentMethod?.toUpperCase()}`,
    ];

    rightLines.forEach((line, i) => {
        doc.text(line, rightX, y + 34 + i * 10, {
            width: CONTENT_WIDTH / 2 - 12,
            align: "right",
        });
    });

    return y + blockH + 12;
};

/**
 * Bill To / Ship To side-by-side addresses
 */
const renderAddresses = (doc, invoice, startY) => {
    const halfW = CONTENT_WIDTH / 2 - 8;

    // Section labels
    doc.font(FONT.bold).fontSize(8).fillColor(COLORS.accent);
    doc.text("BILL TO", MARGIN.left, startY);
    doc.text("SHIP TO", MARGIN.left + halfW + 16, startY);

    hRule(doc, startY + 11, COLORS.divider);

    let y = startY + 16;

    const renderAddr = (addr, name, x) => {
        doc.font(FONT.bold).fontSize(8.5).fillColor(COLORS.textPrimary);
        doc.text(name || addr.name, x, y, { width: halfW });

        doc.font(FONT.regular).fontSize(8).fillColor(COLORS.textSecondary);
        const lines = [
            addr.phone,
            addr.line1,
            addr.line2 || null,
            `${addr.city}, ${addr.state} – ${addr.pincode}`,
            addr.country,
        ].filter(Boolean);

        lines.forEach((line, i) => {
            doc.text(line, x, y + 12 + i * 10, { width: halfW });
        });
    };

    // Billing address (left)
    renderAddr(
        invoice.billingAddress,
        invoice.customerSnapshot?.name,
        MARGIN.left,
    );
    // Shipping address (right)
    renderAddr(invoice.shippingAddress, null, MARGIN.left + halfW + 16);

    const blockHeight = 12 + 5 * 10 + 10; // name + 5 lines + padding
    return y + blockHeight;
};

/**
 * Items table
 * Columns: #, Item, HSN, Qty, Unit Price, Taxable Value, GST%, GST Amt, Total
 */
const renderItemsTable = (doc, items, startY) => {
    // Column definitions [label, width, align]
    const cols = [
        { label: "#", width: 20, align: "center" },
        { label: "Item", width: 170, align: "left" },
        { label: "HSN", width: 30, align: "center" },
        { label: "Qty", width: 22, align: "center" },
        { label: "Unit Price", width: 58, align: "right" },
        { label: "Taxable Val.", width: 63, align: "right" },
        { label: "GST %", width: 36, align: "center" },
        { label: "GST Amt", width: 49, align: "right" },
        { label: "Total", width: 67, align: "right" },
    ];
    // Total width check: 20+170+30+22+58+63+36+49+67 = 515 = CONTENT_WIDTH

    const ROW_H = 22;
    const HEADER_H = 22;
    const TEXT_PAD = 4;

    // Header row background
    fillRect(
        doc,
        MARGIN.left,
        startY,
        CONTENT_WIDTH,
        HEADER_H,
        COLORS.tableHeader,
    );
    hRule(doc, startY, COLORS.tableBorder);
    hRule(doc, startY + HEADER_H, COLORS.tableBorder);

    // Header labels
    doc.font(FONT.bold).fontSize(7.5).fillColor(COLORS.tableHeaderText);
    let cx = MARGIN.left;
    cols.forEach((col) => {
        doc.text(col.label, cx + TEXT_PAD, startY + 7, {
            width: col.width - TEXT_PAD * 2,
            align: col.align,
        });
        cx += col.width;
    });

    let rowY = startY + HEADER_H;

    items.forEach((item, idx) => {
        // Estimate row height (item name may wrap)
        const itemNameHeight = doc
            .font(FONT.bold)
            .fontSize(8)
            .heightOfString(item.productName || "", {
                width: cols[1].width - TEXT_PAD * 2,
            });
        const variantHeight = item.variantName
            ? doc
                  .font(FONT.regular)
                  .fontSize(7)
                  .heightOfString(item.variantName, {
                      width: cols[1].width - TEXT_PAD * 2,
                  })
            : 0;
        const skuHeight = item.sku ? 10 : 0;
        const dynamicH = Math.max(
            ROW_H,
            itemNameHeight + variantHeight + skuHeight + 12,
        );

        // Zebra stripe
        if (idx % 2 === 1) {
            fillRect(
                doc,
                MARGIN.left,
                rowY,
                CONTENT_WIDTH,
                dynamicH,
                COLORS.tableRowAlt,
            );
        }

        hRule(doc, rowY + dynamicH, COLORS.tableBorder);

        const cellY = rowY + (dynamicH - 9) / 2; // vertical center for single-line cells

        doc.font(FONT.regular).fontSize(8).fillColor(COLORS.textPrimary);
        cx = MARGIN.left;

        const cells = [
            { val: String(idx + 1), colIdx: 0 },
            null, // item name handled separately
            { val: item.hsn || "7113", colIdx: 2 },
            { val: String(item.quantity), colIdx: 3 },
            { val: formatPrice(item.sellingPrice), colIdx: 4 },
            { val: formatPrice(item.taxableValue), colIdx: 5 },
            { val: `${item.gstRate}%`, colIdx: 6 },
            { val: formatPrice(item.gstAmount), colIdx: 7 },
            { val: formatPrice(item.total), colIdx: 8 },
        ];

        // Render non-name cells
        cells.forEach((cell, i) => {
            const col = cols[i];
            if (cell === null) {
                // Item name cell — draw below
                cx += col.width;
                return;
            }
            doc.text(cell.val, cx + TEXT_PAD, cellY, {
                width: col.width - TEXT_PAD * 2,
                align: col.align,
            });
            cx += col.width;
        });

        // Item name cell (2nd column, index 1)
        const nameCX = MARGIN.left + cols[0].width;
        doc.font(FONT.bold)
            .fontSize(8)
            .fillColor(COLORS.textPrimary)
            .text(item.productName || "—", nameCX + TEXT_PAD, rowY + 5, {
                width: cols[1].width - TEXT_PAD * 2,
                align: "left",
            });
        if (item.variantName) {
            doc.font(FONT.regular)
                .fontSize(7)
                .fillColor(COLORS.textSecondary)
                .text(
                    item.variantName,
                    nameCX + TEXT_PAD,
                    rowY + 5 + itemNameHeight + 1,
                    {
                        width: cols[1].width - TEXT_PAD * 2,
                        align: "left",
                    },
                );
        }
        if (item.sku) {
            // Position SKU sequentially after product name + variant name
            const skuY =
                rowY +
                5 +
                itemNameHeight +
                (item.variantName ? variantHeight + 2 : 0) +
                2;
            doc.font(FONT.oblique)
                .fontSize(6.5)
                .fillColor(COLORS.textMuted)
                .text(`SKU: ${item.sku}`, nameCX + TEXT_PAD, skuY, {
                    width: cols[1].width - TEXT_PAD * 2,
                    align: "left",
                });
        }

        rowY += dynamicH;
    });

    return rowY + 4;
};

/**
 * Pricing summary (right-aligned block)
 */
const renderPricingSummary = (doc, invoice, startY) => {
    const BLOCK_W = 250;
    const labelX = MARGIN.left + CONTENT_WIDTH - BLOCK_W;
    const valueX = MARGIN.left + CONTENT_WIDTH - 100;
    const labelW = valueX - labelX - 5; // ~145px — room for long discount labels
    const lineH = 14;

    const row = (label, value, bold = false, color = COLORS.textPrimary) => {
        doc.font(bold ? FONT.bold : FONT.regular)
            .fontSize(8.5)
            .fillColor(color)
            .text(label, labelX, startY, { width: labelW, align: "right" })
            .text(value, valueX, startY, { width: 100, align: "right" });
        startY += lineH;
    };

    hRule(doc, startY - 4, COLORS.divider, BLOCK_W);
    startY += 2;

    row(
        "Items Subtotal (excl. GST):",
        formatPrice(invoice.pricing.itemsSubtotal),
    );

    if (invoice.pricing.discount > 0) {
        // Use itemsSubtotal - discountedSubtotal as the pre-GST discount amount
        // so that subtotal - discount = discounted subtotal exactly on the invoice
        const preGstDiscount =
            invoice.pricing.itemsSubtotal - invoice.pricing.discountedSubtotal;
        const discountLabel = invoice.appliedCoupon?.code
            ? `Discount (${invoice.appliedCoupon.code}) excl. GST:`
            : "Discount (excl. GST):";
        row(
            discountLabel,
            `- ${formatPrice(preGstDiscount)}`,
            false,
            COLORS.success,
        );
        row(
            "Discounted Subtotal:",
            formatPrice(invoice.pricing.discountedSubtotal),
        );
    }

    if (invoice.pricing.shippingCharges > 0) {
        row("Shipping Charges:", formatPrice(invoice.pricing.shippingCharges));
    } else {
        row("Shipping:", "Free");
    }

    // Tax split
    const { cgst, sgst, igst } = invoice.taxSplit || {};
    if (cgst > 0 || sgst > 0) {
        row(`CGST:`, formatPrice(cgst));
        row(`SGST:`, formatPrice(sgst));
    } else if (igst > 0) {
        row(`IGST:`, formatPrice(igst));
    } else {
        row("GST:", formatPrice(invoice.pricing.gst));
    }

    startY += 2;
    hRule(doc, startY - 2, COLORS.black, BLOCK_W);
    startY += 6;

    // Total row — larger
    doc.font(FONT.bold)
        .fontSize(11)
        .fillColor(COLORS.textPrimary)
        .text("TOTAL:", labelX, startY, { width: labelW, align: "right" })
        .text(formatPrice(invoice.pricing.total), valueX, startY, {
            width: 100,
            align: "right",
        });

    startY += 18;

    // Amount in words
    doc.font(FONT.oblique)
        .fontSize(7.5)
        .fillColor(COLORS.textSecondary)
        .text(
            `Amount in words: ${numberToWords(invoice.pricing.total)}`,
            MARGIN.left,
            startY,
            { width: CONTENT_WIDTH },
        );

    return startY + 14;
};

/**
 * Tax summary table — CGST/SGST or IGST breakdown by rate
 */
const renderTaxSummary = (doc, invoice, startY) => {
    const { cgst, sgst, igst } = invoice.taxSplit || {};
    const hasIntraState = cgst > 0 || sgst > 0;
    const hasInterState = igst > 0;

    if (!hasIntraState && !hasInterState) return startY;

    startY += 4;
    doc.font(FONT.bold)
        .fontSize(8)
        .fillColor(COLORS.accent)
        .text("TAX SUMMARY", MARGIN.left, startY);
    startY += 12;

    const colW = [120, 80, 60, 80, 80, 80];
    const headers = hasIntraState
        ? [
              "Taxable Amount",
              "CGST Rate",
              "CGST Amt",
              "SGST Rate",
              "SGST Amt",
              "Total GST",
          ]
        : ["Taxable Amount", "IGST Rate", "IGST Amt", "", "", "Total GST"];

    const gstTotal = invoice.pricing.gst;
    const taxableAmount =
        invoice.pricing.taxableAmount ||
        invoice.pricing.discountedSubtotal ||
        invoice.pricing.itemsSubtotal;

    // Derive blended GST rate for display
    const blendedRate =
        taxableAmount > 0
            ? ((gstTotal / taxableAmount) * 100).toFixed(1)
            : "0.0";

    const dataRow = hasIntraState
        ? [
              formatPrice(taxableAmount),
              `${(Number(blendedRate) / 2).toFixed(1)}%`,
              formatPrice(cgst),
              `${(Number(blendedRate) / 2).toFixed(1)}%`,
              formatPrice(sgst),
              formatPrice(gstTotal),
          ]
        : [
              formatPrice(taxableAmount),
              `${blendedRate}%`,
              formatPrice(igst),
              "",
              "",
              formatPrice(gstTotal),
          ];

    fillRect(doc, MARGIN.left, startY, CONTENT_WIDTH, 18, COLORS.tableHeader);
    hRule(doc, startY, COLORS.tableBorder);
    hRule(doc, startY + 18, COLORS.tableBorder);

    doc.font(FONT.bold).fontSize(7.5).fillColor(COLORS.tableHeaderText);
    let cx = MARGIN.left;
    headers.forEach((h, i) => {
        doc.text(h, cx + 4, startY + 5, {
            width: colW[i] - 8,
            align: i === 0 ? "left" : "right",
        });
        cx += colW[i];
    });

    startY += 18;
    hRule(doc, startY + 16, COLORS.tableBorder);

    doc.font(FONT.regular).fontSize(8).fillColor(COLORS.textPrimary);
    cx = MARGIN.left;
    dataRow.forEach((val, i) => {
        doc.text(val, cx + 4, startY + 4, {
            width: colW[i] - 8,
            align: i === 0 ? "left" : "right",
        });
        cx += colW[i];
    });

    return startY + 24;
};

/**
 * Footer: terms note, generation note, page number
 */
const renderFooter = (doc, invoice) => {
    const pageH = doc.page.height;
    const footerY = pageH - MARGIN.bottom - 40;

    hRule(doc, footerY, COLORS.divider);

    doc.font(FONT.regular).fontSize(7).fillColor(COLORS.textMuted);
    doc.text(
        "This is a computer-generated invoice and does not require a physical signature.",
        MARGIN.left,
        footerY + 6,
        { width: CONTENT_WIDTH * 0.6 },
    );
    doc.text(
        `Generated on ${formatDate(new Date())}`,
        MARGIN.left,
        footerY + 16,
        { width: CONTENT_WIDTH * 0.6 },
    );

    doc.font(FONT.regular)
        .fontSize(7)
        .fillColor(COLORS.textMuted)
        .text(
            `Invoice No. ${invoice.invoiceNumber}`,
            MARGIN.left + CONTENT_WIDTH * 0.6,
            footerY + 6,
            { width: CONTENT_WIDTH * 0.4, align: "right" },
        );
};

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Generate a PDF buffer for the given invoice document.
 * @param {Object} invoice - Mongoose invoice document (plain JS object or lean)
 * @returns {Promise<Buffer>} PDF as a Buffer
 */
export const generateInvoicePDF = (invoice) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: "A4",
            margin: 0, // we handle margins manually for full-bleed header
            info: {
                Title: `Invoice ${invoice.invoiceNumber}`,
                Author: invoice.seller?.name || "Sana Silver",
                Subject: `Tax Invoice for Order ${invoice.orderNumber}`,
            },
        });

        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        let y = renderHeader(doc, invoice);
        y = renderAddresses(doc, invoice, y);
        y += 8;
        hRule(doc, y - 4, COLORS.divider);
        y = renderItemsTable(doc, invoice.items, y);
        y += 8;
        y = renderPricingSummary(doc, invoice, y);
        y += 4;
        y = renderTaxSummary(doc, invoice, y);
        renderFooter(doc, invoice);

        doc.end();
    });
};
