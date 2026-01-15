import Category from "../../categories/category.model.js";
import {
    createWorkbook,
    addWorksheet,
    styleHeaderRow,
    addDropdownValidation,
    autoFitColumns,
    writeWorkbookToBuffer,
} from "../utils/excel.util.js";
import logger from "../../../shared/utils/logger.util.js";

/**
 * Product sheet headers - based on actual Product model
 */
const PRODUCT_HEADERS = [
    "_action",
    "product_id",
    "product_name",
    "slug",
    "category",
    "subcategory",
    "description",
    "short_description",
    "purity",
    "making_charges_per_gram",
    "gst_rate",
    "collections",
    "is_featured",
    "is_active",
    "tags",
    "is_hallmarked",
    "bis_license_number",
    "hallmarking_center",
    "purity_certified",
    "gemstone",
    "occasion",
    "gender",
    "plating",
    "meta_title",
    "meta_description",
    "meta_keywords",
];

/**
 * Variant sheet headers - based on actual ProductVariant model
 */
const VARIANT_HEADERS = [
    "_action",
    "product_name",
    "sku",
    "variant_name",
    "attributes",
    "weight",
    "length",
    "width",
    "height",
    "mrp",
    "selling_price",
    "cost_price",
    "stock_quantity",
    "low_stock_threshold",
    "sort_order",
    "is_active",
];

/**
 * Generate empty template with examples
 */
export const generateTemplate = async () => {
    try {
        logger.info("Generating template");

        // Fetch reference data
        const [categories, subcategories] = await Promise.all([
            Category.find({ isActive: true, parent: null })
                .select("name")
                .lean(),
            Category.find({ isActive: true, parent: { $ne: null } })
                .select("name")
                .lean(),
        ]);

        const categoryNames = categories.map((c) => c.name);
        const subcategoryNames = subcategories.map((s) => s.name);

        // Create workbook
        const workbook = createWorkbook();

        // ===== PRODUCTS SHEET =====
        const productsSheet = addWorksheet(workbook, "Products");
        productsSheet.columns = PRODUCT_HEADERS.map((header) => ({
            header,
            key: header,
        }));
        styleHeaderRow(productsSheet, productsSheet.getRow(1));

        // Add example product rows
        productsSheet.addRows([
            {
                _action: "CREATE",
                product_id: "",
                product_name: "Lotus Silver Ring",
                slug: "", // Auto-generated
                category: categoryNames[0] || "Rings",
                subcategory: subcategoryNames[0] || "Designer Rings",
                description:
                    "Beautiful handcrafted silver ring with lotus design. Perfect for daily wear and special occasions.",
                short_description: "Handcrafted silver ring with lotus design",
                purity: "925", // Sterling Silver
                making_charges_per_gram: 50,
                gst_rate: 3,
                collections: "Wedding, Festive",
                is_featured: "TRUE",
                is_active: "TRUE",
                tags: "silver, ring, lotus, designer, handcrafted",
                is_hallmarked: "TRUE",
                bis_license_number: "BIS-12345",
                hallmarking_center: "Mumbai",
                purity_certified: "925",
                gemstone: "",
                occasion: "Wedding, Daily Wear",
                gender: "women",
                plating: "Rhodium",
                meta_title:
                    "Lotus Silver Ring - Handcrafted 925 Sterling Silver",
                meta_description:
                    "Shop beautiful handcrafted lotus silver ring in 925 sterling silver. Perfect for weddings and daily wear.",
                meta_keywords:
                    "silver ring, lotus ring, 925 silver, handcrafted ring",
            },
            {
                _action: "CREATE",
                product_id: "",
                product_name: "Silver Anklet Chain",
                slug: "", // Auto-generated
                category: categoryNames[0] || "Anklets",
                subcategory: "",
                description:
                    "Elegant silver anklet chain with delicate design. Comfortable for all-day wear.",
                short_description: "Elegant silver anklet chain",
                purity: "999", // Pure Silver
                making_charges_per_gram: 35,
                gst_rate: 3,
                collections: "Traditional",
                is_featured: "FALSE",
                is_active: "TRUE",
                tags: "silver, anklet, chain, traditional",
                is_hallmarked: "TRUE",
                bis_license_number: "BIS-67890",
                hallmarking_center: "Delhi",
                purity_certified: "999",
                gemstone: "",
                occasion: "Daily Wear, Festive",
                gender: "women",
                plating: "",
                meta_title: "Silver Anklet Chain - Pure 999 Silver",
                meta_description:
                    "Shop elegant silver anklet chain in pure 999 silver. Traditional design for daily wear.",
                meta_keywords:
                    "silver anklet, 999 silver, anklet chain, traditional anklet",
            },
        ]);

        // Add dropdowns for validation
        addDropdownValidation(productsSheet, "A", 2, 1000, [
            "CREATE",
            "UPDATE",
        ]);
        addDropdownValidation(productsSheet, "I", 2, 1000, ["925", "999"]);
        addDropdownValidation(productsSheet, "V", 2, 1000, [
            "men",
            "women",
            "unisex",
        ]);

        autoFitColumns(productsSheet);

        // ===== VARIANTS SHEET =====
        const variantsSheet = addWorksheet(workbook, "Variants");
        variantsSheet.columns = VARIANT_HEADERS.map((header) => ({
            header,
            key: header,
        }));
        styleHeaderRow(variantsSheet, variantsSheet.getRow(1));

        // Add example variant rows
        variantsSheet.addRows([
            {
                _action: "CREATE",
                product_name: "Lotus Silver Ring",
                sku: "", // Auto-generated
                variant_name: "Size 7",
                attributes: "Size:7",
                weight: 5.5, // in grams
                length: "",
                width: "",
                height: "",
                mrp: 3500,
                selling_price: 3200,
                cost_price: 2800,
                stock_quantity: 25,
                low_stock_threshold: 5,
                sort_order: 700,
                is_active: "TRUE",
            },
            {
                _action: "CREATE",
                product_name: "Lotus Silver Ring",
                sku: "", // Auto-generated
                variant_name: "Size 8",
                attributes: "Size:8",
                weight: 5.8, // in grams
                length: "",
                width: "",
                height: "",
                mrp: 3600,
                selling_price: 3300,
                cost_price: 2900,
                stock_quantity: 30,
                low_stock_threshold: 5,
                sort_order: 800,
                is_active: "TRUE",
            },
            {
                _action: "CREATE",
                product_name: "Silver Anklet Chain",
                sku: "", // Auto-generated
                variant_name: "9 inch",
                attributes: "Length:9 inch",
                weight: 8.0, // in grams
                length: 23, // in cm
                width: 0.3,
                height: 0.1,
                mrp: 2800,
                selling_price: 2500,
                cost_price: 2200,
                stock_quantity: 40,
                low_stock_threshold: 8,
                sort_order: 900,
                is_active: "TRUE",
            },
            {
                _action: "CREATE",
                product_name: "Silver Anklet Chain",
                sku: "", // Auto-generated
                variant_name: "10 inch",
                attributes: "Length:10 inch",
                weight: 8.8, // in grams
                length: 25.4, // in cm
                width: 0.3,
                height: 0.1,
                mrp: 3000,
                selling_price: 2700,
                cost_price: 2400,
                stock_quantity: 35,
                low_stock_threshold: 8,
                sort_order: 1000,
                is_active: "TRUE",
            },
        ]);

        // Add dropdowns
        addDropdownValidation(variantsSheet, "A", 2, 1000, [
            "CREATE",
            "UPDATE",
        ]);

        autoFitColumns(variantsSheet);

        // ===== REFERENCE SHEET =====
        const referenceSheet = addWorksheet(workbook, "Reference");
        referenceSheet.columns = [
            { header: "Field", key: "field", width: 30 },
            { header: "Allowed Values", key: "values", width: 50 },
            { header: "Description", key: "description", width: 60 },
        ];
        styleHeaderRow(referenceSheet, referenceSheet.getRow(1));

        // Add reference data
        referenceSheet.addRows([
            {
                field: "PRODUCTS SHEET",
                values: "",
                description: "Main product information",
            },
            {
                field: "_action",
                values: "CREATE, UPDATE",
                description:
                    "CREATE for new products, UPDATE for existing (requires product_id)",
            },
            {
                field: "product_id",
                values: "24-char MongoDB ID",
                description: "Required for UPDATE, leave empty for CREATE",
            },
            {
                field: "product_name",
                values: "Text (3-200 chars)",
                description: "REQUIRED. Unique product name",
            },
            {
                field: "slug",
                values: "Auto-generated",
                description:
                    "Leave empty, will be auto-generated from product name",
            },
            {
                field: "category",
                values: categoryNames.join(", "),
                description: "REQUIRED. Must match existing category",
            },
            {
                field: "subcategory",
                values: subcategoryNames.join(", "),
                description: "OPTIONAL. Must match existing subcategory",
            },
            {
                field: "purity",
                values: "925, 999",
                description:
                    "REQUIRED. 925 = Sterling Silver, 999 = Pure Silver",
            },
            {
                field: "making_charges_per_gram",
                values: "Number (0-100000)",
                description: "REQUIRED. Making charges in rupees per gram",
            },
            {
                field: "gst_rate",
                values: "Number (0-100)",
                description: "GST rate percentage. Default: 3",
            },
            {
                field: "collections",
                values: "Comma-separated",
                description:
                    "Product collections (e.g., Wedding, Festive, Traditional)",
            },
            {
                field: "is_featured",
                values: "TRUE, FALSE",
                description: "Whether product is featured",
            },
            {
                field: "is_active",
                values: "TRUE, FALSE",
                description: "Whether product is active. Default: TRUE",
            },
            {
                field: "gender",
                values: "men, women, unisex",
                description: "Target gender",
            },
            {
                field: "",
                values: "",
                description: "",
            },
            {
                field: "VARIANTS SHEET",
                values: "",
                description: "Product variant information",
            },
            {
                field: "_action",
                values: "CREATE, UPDATE",
                description:
                    "CREATE for new variants, UPDATE for existing (requires sku)",
            },
            {
                field: "product_name",
                values: "Must match Products sheet",
                description: "REQUIRED. Links variant to product",
            },
            {
                field: "sku",
                values: "Auto-generated for CREATE",
                description:
                    "Leave empty for CREATE (auto-generated). Required for UPDATE",
            },
            {
                field: "variant_name",
                values: "Text",
                description: "REQUIRED. Name like 'Size 7', '9 inch', etc.",
            },
            {
                field: "attributes",
                values: "key:value; key:value",
                description:
                    "Format: Size:7; Color:Silver (semicolon separated)",
            },
            {
                field: "weight",
                values: "Number (in grams)",
                description: "REQUIRED. Weight in grams",
            },
            {
                field: "selling_price",
                values: "Number",
                description: "REQUIRED. Selling price in rupees",
            },
            {
                field: "mrp",
                values: "Number",
                description: "OPTIONAL. MRP must be >= selling_price",
            },
            {
                field: "stock_quantity",
                values: "Number",
                description: "Available stock quantity. Default: 0",
            },
            {
                field: "dimensions",
                values: "length, width, height (cm)",
                description: "OPTIONAL. Dimensions in centimeters",
            },
            {
                field: "",
                values: "",
                description: "",
            },
            {
                field: "IMPORTANT NOTES",
                values: "",
                description: "",
            },
            {
                field: "1. Images",
                values: "NOT supported in bulk",
                description: "Add images via regular API after bulk import",
            },
            {
                field: "2. Product-Variant Link",
                values: "By product_name",
                description:
                    "Variants must have matching product_name from Products sheet",
            },
            {
                field: "3. SKU Generation",
                values: "Automatic for CREATE",
                description: "Format: SS-CATEGORY-NAME-NUMBER-VARIANT",
            },
            {
                field: "4. Validation",
                values: "All-or-nothing",
                description:
                    "If any error, nothing will be imported (transaction rollback)",
            },
            {
                field: "5. Column Order",
                values: "Doesn't matter",
                description:
                    "Columns can be in any order, system uses header names",
            },
        ]);

        autoFitColumns(referenceSheet);

        // Write to buffer
        const buffer = await writeWorkbookToBuffer(workbook);

        logger.info("Template generated successfully");

        return {
            buffer,
            filename: `products_template_${
                new Date().toISOString().split("T")[0]
            }.xlsx`,
        };
    } catch (error) {
        logger.error("Error generating template:", error);
        throw error;
    }
};

export default {
    generateTemplate,
};
