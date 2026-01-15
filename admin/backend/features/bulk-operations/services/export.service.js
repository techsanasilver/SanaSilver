import Product from "../../products/product.model.js";
import ProductVariant from "../../products/product-variant.model.js";
import Category from "../../categories/category.model.js";
import {
    createWorkbook,
    addWorksheet,
    styleHeaderRow,
    autoFitColumns,
    writeWorkbookToBuffer,
} from "../utils/excel.util.js";
import { mapProductToExcel, mapVariantToExcel } from "../utils/mapper.util.js";
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
 * Export products to Excel
 */
export const exportProducts = async (filters = {}) => {
    try {
        logger.info("Starting product export with filters:", filters);

        // Build query
        const query = { isActive: true }; // Changed from isDeleted to isActive

        if (filters.category) {
            query.category = filters.category;
        }

        if (filters.subcategory) {
            query.subcategory = filters.subcategory;
        }

        if (filters.isFeatured !== undefined) {
            query.isFeatured = filters.isFeatured;
        }

        if (filters.collections) {
            query.collections = { $in: filters.collections };
        }

        if (filters.purity) {
            query.purity = filters.purity;
        }

        // Fetch products
        const products = await Product.find(query)
            .populate("category", "name")
            .populate("subcategory", "name")
            .lean();

        logger.info(`Found ${products.length} products to export`);

        // Fetch all variants for these products
        const productIds = products.map((p) => p._id);
        const variants = await ProductVariant.find({
            product: { $in: productIds },
            isActive: true,
        })
            .populate("product", "name")
            .lean();

        logger.info(`Found ${variants.length} variants to export`);

        // Fetch all categories and subcategories for mapping
        const [categories, subcategories] = await Promise.all([
            Category.find({ isActive: true, parent: null })
                .select("_id name")
                .lean(),
            Category.find({ isActive: true, parent: { $ne: null } })
                .select("_id name")
                .lean(),
        ]);

        // Create maps for quick lookup
        const categoryMap = new Map(
            categories.map((cat) => [cat._id.toString(), cat.name])
        );
        const subcategoryMap = new Map(
            subcategories.map((sub) => [sub._id.toString(), sub.name])
        );

        // Create workbook
        const workbook = createWorkbook();

        // Add Products sheet
        const productsSheet = addWorksheet(workbook, "Products");
        productsSheet.columns = PRODUCT_HEADERS.map((header) => ({
            header,
            key: header,
        }));
        styleHeaderRow(productsSheet, productsSheet.getRow(1));

        // Add product data
        const productData = products.map((product) =>
            mapProductToExcel(product, categoryMap, subcategoryMap)
        );
        productsSheet.addRows(productData);
        autoFitColumns(productsSheet);

        // Add Variants sheet
        const variantsSheet = addWorksheet(workbook, "Variants");
        variantsSheet.columns = VARIANT_HEADERS.map((header) => ({
            header,
            key: header,
        }));
        styleHeaderRow(variantsSheet, variantsSheet.getRow(1));

        // Add variant data
        const variantData = variants.map((variant) => {
            // Find the product name for this variant
            const product = products.find(
                (p) => p._id.toString() === variant.product._id.toString()
            );
            const productName = product
                ? product.name
                : variant.product.name || "";
            return mapVariantToExcel(variant, productName);
        });
        variantsSheet.addRows(variantData);
        autoFitColumns(variantsSheet);

        // Add Reference sheet
        const referenceSheet = addWorksheet(workbook, "Reference");
        referenceSheet.columns = [
            { header: "Field", key: "field" },
            { header: "Allowed Values", key: "values" },
            { header: "Description", key: "description" },
        ];
        styleHeaderRow(referenceSheet, referenceSheet.getRow(1));

        // Add reference data
        referenceSheet.addRows([
            {
                field: "_action",
                values: "CREATE, UPDATE",
                description:
                    "CREATE for new products/variants, UPDATE for existing ones",
            },
            {
                field: "purity",
                values: "925, 999",
                description: "Silver purity - 925 (Sterling) or 999 (Pure)",
            },
            {
                field: "gender",
                values: "men, women, unisex",
                description: "Target gender for the product",
            },
            {
                field: "boolean_values",
                values: "TRUE, FALSE",
                description:
                    "Boolean fields like is_featured, is_active, is_hallmarked, etc.",
            },
            {
                field: "attributes",
                values: "key:value; key:value",
                description:
                    "Variant attributes in format: Size:7; Color:Silver (semicolon separated)",
            },
            {
                field: "categories",
                values: categories.map((c) => c.name).join(", "),
                description: "Available categories",
            },
            {
                field: "subcategories",
                values: subcategories.map((s) => s.name).join(", "),
                description: "Available subcategories",
            },
            {
                field: "weight",
                values: "In grams",
                description: "Variant weight in grams (e.g., 5.5)",
            },
            {
                field: "dimensions",
                values: "length, width, height in cm or mm",
                description: "Optional dimensions for the variant",
            },
        ]);
        autoFitColumns(referenceSheet);

        // Write to buffer
        const buffer = await writeWorkbookToBuffer(workbook);

        logger.info("Product export completed successfully");

        return {
            buffer,
            filename: `products_export_${
                new Date().toISOString().split("T")[0]
            }.xlsx`,
            stats: {
                totalProducts: products.length,
                totalVariants: variantData.length,
            },
        };
    } catch (error) {
        logger.error("Error exporting products:", error);
        throw error;
    }
};

export default {
    exportProducts,
};
