# Bulk Operations System - Complete Documentation

**Version**: 1.2.0  
**Last Updated**: January 16, 2026  
**Status**: Production Ready

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Complete Validation Rules](#complete-validation-rules)
4. [API Endpoints](#api-endpoints)
5. [Testing Guide](#testing-guide)
6. [Usage Guide](#usage-guide)
7. [Excel File Format](#excel-file-format)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)
11. [System Updates](#system-updates)

---

## Overview

The Bulk Operations system allows administrators to import/export large numbers of products and variants using Excel files. This system is designed for jewelry e-commerce, specifically for Sana Silver's 925 and 999 silver products.

### Key Features

-   ✅ **Excel-based Import/Export**: Use familiar Excel interface
-   ✅ **Transaction Support**: All-or-nothing approach (if any error, nothing is imported)
-   ✅ **Two-Phase Validation**: Complete validation before any database changes
-   ✅ **Auto-SKU Generation**: SKUs are automatically generated for new variants
-   ✅ **Auto-Slug Generation**: Product slugs are automatically generated from name
-   ✅ **Partial Updates**: Empty cells are ignored during UPDATE (data preserved)
-   ✅ **Duplicate Prevention**: Blocks duplicate product names during CREATE
-   ✅ **Direct Streaming**: Export files stream directly (no filesystem storage)
-   ✅ **Operation Tracking**: Full audit trail of all bulk operations
-   ✅ **Column Order Independent**: Columns can be in any order, system uses header names

### Limitations

-   ❌ **No Image Support**: Images must be added via regular API after bulk import
-   ❌ **No DELETE Operations**: Only CREATE and UPDATE operations supported
-   ⚠️ **Maximum File Size**: 10MB limit for Excel files
-   ⚠️ **Format**: Only .xlsx and .xls files accepted

---

## System Architecture

### Data Model

```
Product (Separate Collection)
├── name (required, must be unique for CREATE)
├── slug (auto-generated, unique)
├── category (required, ObjectId ref)
├── subcategory (optional, ObjectId ref)
├── purity (required: "925" or "999")
├── makingChargesPerGram (required)
├── gstRate (default: 3)
├── images (array - empty for bulk, added later via API)
└── ... other fields

ProductVariant (Separate Collection)
├── product (required, ObjectId ref)
├── sku (auto-generated for CREATE, unique)
├── variantName (required)
├── weight (required, in grams)
├── sellingPrice (required)
├── attributes (array of {key, value})
└── ... other fields
```

### Import Flow

```
1. Upload Excel File
   ↓
2. Parse Excel (products & variants sheets)
   ↓
3. Validate All Data (Phase 1)
   - Validate required fields
   - Check for duplicate product names (DB + file)
   - Validate category/subcategory existence
   - Validate data types and ranges
   - Check for duplicate SKUs in file
   ↓
4. If validation fails → Return ALL errors, NO import
   ↓
5. If validation passes → Start Transaction
   ↓
6. Import Products (Phase 2)
   - Auto-generate slugs for CREATE
   - Skip images validation (empty array)
   - Apply partial updates for UPDATE
   ↓
7. Import Variants (Phase 2)
   - Auto-generate SKUs for CREATE
   - Link to products by name
   - Apply partial updates for UPDATE
   ↓
8. Commit Transaction (all-or-nothing)
   ↓
9. Return Success Statistics
```

### Export Flow

```
1. Receive export request with filters
   ↓
2. Query products from database
   ↓
3. Query variants for those products
   ↓
4. Generate Excel buffer in memory
   ↓
5. Stream directly to client (NO filesystem storage)
   ↓
6. Track operation in database (metadata only)
```

---

## Complete Validation Rules

### 🔴 Critical Rules (Will Block Import)

#### 1. Product Name Duplication (CREATE only)

-   **Rule**: Product name must be unique
-   **Checks**:
    -   ❌ Name already exists in database → Error with existing product ID
    -   ❌ Name appears multiple times in Excel → Error with first occurrence row
-   **Error Example**: `Product "Silver Ring" already exists in database (ID: 507f...). Use UPDATE action with product_id to update it.`
-   **Fix**: Either change product name or use UPDATE action with product_id

#### 2. Required Fields (CREATE operations)

-   **Products**: `_action`, `product_name`, `category`, `purity`, `making_charges_per_gram`
-   **Variants**: `_action`, `product_name`, `variant_name`, `weight`, `selling_price`
-   **Error Example**: `product_name is required`

#### 3. Category/Subcategory Existence

-   **Rule**: Category must exist in database (case-insensitive match)
-   **Rule**: Subcategory must exist if provided
-   **Error Example**: `Category "Ringes" not found` (typo in category name)

#### 4. ObjectId Format (UPDATE operations)

-   **Rule**: `product_id` and `sku` must be valid MongoDB ObjectIds or SKU format
-   **Format**: 24 hexadecimal characters for ObjectId
-   **Error Example**: `Invalid product_id format`

---

### 📋 Field-Specific Validation Rules

#### Common Rules

| Field     | Type    | Rules                            | Examples         |
| --------- | ------- | -------------------------------- | ---------------- |
| `_action` | Enum    | Must be "CREATE" or "UPDATE"     | CREATE, UPDATE   |
| Boolean   | Boolean | TRUE/FALSE, yes/no, 1/0 accepted | TRUE, false, 1   |
| Arrays    | String  | Comma-separated, auto-trimmed    | tag1, tag2, tag3 |
| Numbers   | Number  | Must be valid numeric values     | 123, 45.67, 0    |

---

### Product Validation (CREATE)

| Field                     | Required | Type    | Min | Max    | Rules                               | Example                   |
| ------------------------- | -------- | ------- | --- | ------ | ----------------------------------- | ------------------------- |
| `_action`                 | ✅       | Enum    | -   | -      | Must be "CREATE"                    | CREATE                    |
| `product_id`              | ❌       | -       | -   | -      | Must be EMPTY for CREATE            | (empty)                   |
| `product_name`            | ✅       | String  | 3   | 200    | Unique, no duplicates               | Lotus Silver Ring         |
| `slug`                    | ❌       | String  | -   | -      | Auto-generated from name            | (auto: lotus-silver-ring) |
| `category`                | ✅       | String  | -   | -      | Must exist in DB (case-insensitive) | Rings                     |
| `subcategory`             | ❌       | String  | -   | -      | Must exist in DB if provided        | Designer Rings            |
| `description`             | ❌       | String  | 0   | 5000   | Product description                 | Beautiful handcrafted...  |
| `short_description`       | ❌       | String  | 0   | 500    | Brief description                   | Handcrafted silver ring   |
| `purity`                  | ✅       | Enum    | -   | -      | "925" or "999" only                 | 925                       |
| `making_charges_per_gram` | ✅       | Number  | 0   | 100000 | Positive number                     | 50                        |
| `gst_rate`                | ❌       | Number  | 0   | 100    | Percentage (default: 3)             | 3                         |
| `collections`             | ❌       | Array   | -   | -      | Comma-separated values              | Wedding, Festive          |
| `is_featured`             | ❌       | Boolean | -   | -      | Default: FALSE                      | TRUE                      |
| `is_active`               | ❌       | Boolean | -   | -      | Default: TRUE                       | TRUE                      |
| `tags`                    | ❌       | Array   | -   | -      | Comma-separated keywords            | silver, ring, lotus       |
| `is_hallmarked`           | ❌       | Boolean | -   | -      | Hallmark indicator                  | TRUE                      |
| `bis_license_number`      | ❌       | String  | -   | -      | BIS license (if hallmarked)         | BIS-12345                 |
| `hallmarking_center`      | ❌       | String  | -   | -      | Center name (if hallmarked)         | Mumbai                    |
| `purity_certified`        | ❌       | String  | -   | -      | Certified purity value              | 925                       |
| `gemstone`                | ❌       | String  | -   | -      | Gemstone type                       | Diamond                   |
| `occasion`                | ❌       | String  | -   | -      | Suitable occasions                  | Wedding, Daily Wear       |
| `gender`                  | ❌       | Enum    | -   | -      | "men", "women", "unisex"            | women                     |
| `plating`                 | ❌       | String  | -   | -      | Plating type                        | Rhodium                   |
| `meta_title`              | ❌       | String  | -   | -      | SEO page title                      | Beautiful Silver Ring     |
| `meta_description`        | ❌       | String  | -   | -      | SEO meta description                | Shop elegant rings...     |
| `meta_keywords`           | ❌       | Array   | -   | -      | SEO keywords (comma-separated)      | silver, ring, jewelry     |

### Product Validation (UPDATE)

| Field                | Required | Rules                                 | Notes                        |
| -------------------- | -------- | ------------------------------------- | ---------------------------- |
| `_action`            | ✅       | Must be "UPDATE"                      | -                            |
| `product_id`         | ✅       | Must be valid 24-char ObjectId        | Identifies product to update |
| **All other fields** | ❌       | **Empty cells = keep existing value** | **Partial update - safe**    |

**🔑 Key Behavior for UPDATE:**

-   Only fields with values are updated
-   Empty cells are **ignored** (existing data preserved)
-   No risk of accidental data loss

---

### Variant Validation (CREATE)

| Field                 | Required | Type    | Min  | Max      | Rules                                | Example              |
| --------------------- | -------- | ------- | ---- | -------- | ------------------------------------ | -------------------- |
| `_action`             | ✅       | Enum    | -    | -        | Must be "CREATE"                     | CREATE               |
| `product_name`        | ✅       | String  | -    | -        | Must match product in Products sheet | Lotus Silver Ring    |
| `sku`                 | ❌       | String  | -    | -        | Auto-generated (leave empty)         | (auto: SS-RINGS...)  |
| `variant_name`        | ✅       | String  | 1    | 200      | Variant identifier                   | Size 7               |
| `attributes`          | ❌       | String  | -    | -        | Format: "key:value; key:value"       | Size:7; Color:Silver |
| `weight`              | ✅       | Number  | 0.01 | 100000   | In grams, positive                   | 5.5                  |
| `length`              | ❌       | Number  | 0    | 10000    | In cm (dimensions)                   | 2.5                  |
| `width`               | ❌       | Number  | 0    | 10000    | In cm (dimensions)                   | 2.0                  |
| `height`              | ❌       | Number  | 0    | 10000    | In cm (dimensions)                   | 0.5                  |
| `mrp`                 | ❌       | Number  | 0    | 10000000 | Must be ≥ selling_price if provided  | 3500                 |
| `selling_price`       | ✅       | Number  | 0    | 10000000 | Customer price                       | 3200                 |
| `cost_price`          | ❌       | Number  | 0    | 10000000 | Internal cost                        | 2800                 |
| `stock_quantity`      | ❌       | Number  | 0    | 1000000  | Available inventory                  | 25                   |
| `low_stock_threshold` | ❌       | Number  | 0    | 10000    | Alert threshold (default: 5)         | 5                    |
| `sort_order`          | ❌       | Number  | -    | -        | Display ordering                     | 700                  |
| `is_active`           | ❌       | Boolean | -    | -        | Availability (default: TRUE)         | TRUE                 |

### Variant Validation (UPDATE)

| Field                | Required | Rules                                 | Notes                         |
| -------------------- | -------- | ------------------------------------- | ----------------------------- |
| `_action`            | ✅       | Must be "UPDATE"                      | -                             |
| `sku`                | ✅       | Must exist in database                | Unique identifier for variant |
| `product_name`       | ❌       | Optional (for reference)              | Helps identify which product  |
| **All other fields** | ❌       | **Empty cells = keep existing value** | **Partial update - safe**     |

**🔑 Key Behavior for UPDATE:**

-   SKU is the unique identifier
-   Only fields with values are updated
-   Empty cells are **ignored** (existing data preserved)

---

### Special Validation Rules

#### 1. MRP vs Selling Price

-   **Rule**: If MRP is provided, it must be ≥ selling_price
-   **Error**: `MRP must be greater than or equal to selling price`

#### 2. Attribute Format

-   **Valid**: `Size:7; Color:Silver; Material:Sterling Silver`
-   **Format**: `key:value` pairs separated by semicolons
-   **Parsing**: Automatically trims spaces

#### 3. Collections & Tags

-   **Format**: Comma-separated values
-   **Parsing**: Automatically trims spaces and filters empty values
-   **Example**: `Wedding, Festive, Daily Wear` → `["Wedding", "Festive", "Daily Wear"]`

#### 4. Boolean Conversions

-   **TRUE**: `TRUE`, `true`, `yes`, `Yes`, `1`
-   **FALSE**: `FALSE`, `false`, `no`, `No`, `0`
-   **Case-insensitive**: All variations work

#### 5. Product-Variant Linking

-   **Rule**: Variant's `product_name` must match a product in:
    -   Products sheet (same file), OR
    -   Existing products in database
-   **Error**: `Product "Ring Name" not found in file or database`

---

## API Endpoints

### Base URL

```
http://localhost:5000/api/admin/bulk-operations
```

### Authentication

All endpoints require authentication. Include admin JWT token:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

### 1. Download Template

**Endpoint**: `GET /template`

**Description**: Download an Excel template with example data and reference information.

**Request**:

```http
GET http://localhost:5000/api/admin/bulk-operations/template
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response**:

-   **Status**: 200 OK
-   **Content-Type**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
-   **Body**: Excel file download

**File Contains**:

-   **Products Sheet**: 2 example product rows
-   **Variants Sheet**: 4 example variant rows
-   **Reference Sheet**: Complete field documentation

---

### 2. Export Products

**Endpoint**: `POST /export`

**Description**: Export existing products and variants to Excel file.

**Request**:

```http
POST http://localhost:5000/api/admin/bulk-operations/export
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "category": "65f1234567890abcdef12345",
  "subcategory": "65f1234567890abcdef12346",
  "isFeatured": true,
  "purity": "925",
  "collections": ["Wedding", "Festive"]
}
```

**Request Body** (all optional):

```json
{
  "category": "ObjectId or empty",
  "subcategory": "ObjectId or empty",
  "isFeatured": true/false,
  "purity": "925" or "999",
  "collections": ["array", "of", "collections"]
}
```

**Response**:

```json
{
    "success": true,
    "message": "Export completed successfully",
    "data": {
        "operationId": "65f9876543210abcdef98765",
        "downloadUrl": "/uploads/bulk-operations/products_export_1736899200000.xlsx",
        "expiresAt": "2026-01-22T10:30:00.000Z",
        "stats": {
            "totalRows": 45,
            "duration": 1234
        }
    }
}
```

**Download File**:

```http
GET http://localhost:5000/uploads/bulk-operations/products_export_1736899200000.xlsx
```

---

### 3. Import Products

**Endpoint**: `POST /import`

**Description**: Import products and variants from Excel file.

**Request**:

```http
POST http://localhost:5000/api/admin/bulk-operations/import
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

file: [Excel File]
```

**Success Response**:

```json
{
    "success": true,
    "message": "Import completed successfully",
    "data": {
        "operationId": "65f9876543210abcdef98765",
        "status": "completed",
        "stats": {
            "products": {
                "valid": 10,
                "invalid": 0,
                "created": 7,
                "updated": 3
            },
            "variants": {
                "valid": 25,
                "invalid": 0,
                "created": 20,
                "updated": 5
            }
        },
        "warnings": [],
        "duration": 3456
    }
}
```

**Validation Error Response**:

```json
{
    "success": true,
    "message": "Import validation failed",
    "data": {
        "operationId": "65f9876543210abcdef98765",
        "status": "failed",
        "errors": [
            {
                "row": 3,
                "sheet": "Products",
                "action": "CREATE",
                "productName": "Silver Ring",
                "severity": "error",
                "errors": [
                    {
                        "field": "purity",
                        "message": "purity is required"
                    }
                ]
            },
            {
                "row": 5,
                "sheet": "Variants",
                "action": "CREATE",
                "severity": "error",
                "errors": [
                    {
                        "field": "weight",
                        "message": "weight is required"
                    }
                ]
            }
        ],
        "stats": {
            "products": {
                "valid": 8,
                "invalid": 2
            },
            "variants": {
                "valid": 20,
                "invalid": 5
            }
        }
    }
}
```

---

### 4. Get Operation Status

**Endpoint**: `GET /:id`

**Description**: Get details of a specific bulk operation.

**Request**:

```http
GET http://localhost:5000/api/admin/bulk-operations/65f9876543210abcdef98765
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response**:

```json
{
    "success": true,
    "message": "Operation retrieved successfully",
    "data": {
        "operation": {
            "_id": "65f9876543210abcdef98765",
            "type": "import",
            "entity": "products",
            "status": "completed",
            "fileName": "products_import.xlsx",
            "fileSize": 45678,
            "totalRows": 35,
            "processedRows": 35,
            "stats": {
                "products": {
                    "created": 10,
                    "updated": 5,
                    "valid": 15,
                    "invalid": 0
                },
                "variants": {
                    "created": 15,
                    "updated": 5,
                    "valid": 20,
                    "invalid": 0
                }
            },
            "errors": [],
            "warnings": [],
            "performedBy": {
                "_id": "65f1234567890abcdef12345",
                "name": "Admin Name",
                "email": "admin@example.com"
            },
            "startedAt": "2026-01-15T10:00:00.000Z",
            "completedAt": "2026-01-15T10:00:05.000Z",
            "duration": 5000,
            "createdAt": "2026-01-15T10:00:00.000Z",
            "updatedAt": "2026-01-15T10:00:05.000Z"
        }
    }
}
```

---

### 5. List Operations

**Endpoint**: `GET /`

**Description**: List all bulk operations with pagination and filters.

**Request**:

```http
GET http://localhost:5000/api/admin/bulk-operations?type=import&status=completed&page=1&limit=20
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters**:

-   `type`: `import` or `export`
-   `status`: `pending`, `processing`, `completed`, `failed`
-   `page`: Page number (default: 1)
-   `limit`: Items per page (default: 20)

**Response**:

```json
{
  "success": true,
  "message": "Operations retrieved successfully",
  "data": [
    {
      "_id": "65f9876543210abcdef98765",
      "type": "import",
      "status": "completed",
      "fileName": "products_import.xlsx",
      "stats": { ... },
      "createdAt": "2026-01-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

## Testing Guide

### Prerequisites

1. ✅ Server running: `npm run dev`
2. ✅ MongoDB connected
3. ✅ Admin user logged in with valid JWT token
4. ✅ At least one category exists
5. ✅ Postman or Thunder Client installed

---

### Getting JWT Token

**Step 1**: Login as admin

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "your_password"
}
```

**Step 2**: Copy the `accessToken` from response

**Step 3**: In Postman, set as environment variable:

-   Variable: `admin_token`
-   Value: `YOUR_TOKEN_HERE`

---

### Postman Collection

Create a new collection with these requests:

#### 1. Download Template

```
Method: GET
URL: {{base_url}}/api/admin/bulk-operations/template
Headers:
  Authorization: Bearer {{admin_token}}

Test: Check status is 200, file downloads
```

#### 2. Export All Products

```
Method: POST
URL: {{base_url}}/api/admin/bulk-operations/export
Headers:
  Authorization: Bearer {{admin_token}}
  Content-Type: application/json
Body (raw JSON):
{}

Test: Check operationId returned
```

#### 3. Export with Filters

```
Method: POST
URL: {{base_url}}/api/admin/bulk-operations/export
Headers:
  Authorization: Bearer {{admin_token}}
  Content-Type: application/json
Body (raw JSON):
{
  "isFeatured": true,
  "purity": "925"
}
```

#### 4. Import Products

```
Method: POST
URL: {{base_url}}/api/admin/bulk-operations/import
Headers:
  Authorization: Bearer {{admin_token}}
Body (form-data):
  file: [Select Excel File]

Test: Check status is "completed" or see errors
```

#### 5. Get Operation

```
Method: GET
URL: {{base_url}}/api/admin/bulk-operations/{{operation_id}}
Headers:
  Authorization: Bearer {{admin_token}}
```

#### 6. List Operations

```
Method: GET
URL: {{base_url}}/api/admin/bulk-operations?page=1&limit=10
Headers:
  Authorization: Bearer {{admin_token}}
```

---

### Environment Variables for Postman

```json
{
    "base_url": "http://localhost:5000",
    "admin_token": "YOUR_JWT_TOKEN_HERE"
}
```

---

## Usage Guide

### Scenario 1: Creating New Products

**Step 1**: Download the template

```http
GET /api/admin/bulk-operations/template
```

**Step 2**: Open Excel file and go to "Products" sheet

**Step 3**: Add your products (keep example rows for reference or delete them)

Example:

```
_action     | product_name        | category | purity | making_charges_per_gram | ...
CREATE      | Silver Lotus Ring   | Rings    | 925    | 50                      | ...
CREATE      | Gold Plated Anklet  | Anklets  | 999    | 35                      | ...
```

**Step 4**: Go to "Variants" sheet and add variants

Example:

```
_action | product_name        | variant_name | weight | selling_price | ...
CREATE  | Silver Lotus Ring   | Size 7       | 5.5    | 3200          | ...
CREATE  | Silver Lotus Ring   | Size 8       | 5.8    | 3300          | ...
CREATE  | Gold Plated Anklet  | 9 inch       | 8.0    | 2500          | ...
```

**Important Notes**:

-   Leave `product_id` EMPTY for CREATE
-   Leave `sku` EMPTY for CREATE (auto-generated)
-   `product_name` in Variants sheet MUST match Products sheet
-   Each product must have at least one variant

**Step 5**: Save the file and import via API

---

### Scenario 2: Updating Existing Products

**Step 1**: Export existing products

```http
POST /api/admin/bulk-operations/export
Body: {}
```

**Step 2**: Download the exported file

**Step 3**: Open Excel and modify values you want to change

Example:

```
_action | product_id                | product_name        | making_charges_per_gram
UPDATE  | 65f1234567890abcdef12345  | Silver Lotus Ring   | 55  (changed from 50)
```

**Important Notes**:

-   Keep `_action` as `UPDATE`
-   Keep `product_id` unchanged
-   Only modify fields you want to update
-   Other products NOT in Excel remain unchanged

**Step 4**: For variants, use SKU to identify

```
_action | sku                  | selling_price | stock_quantity
UPDATE  | SS-RINGS-LOTUS-001-S7| 3400          | 30  (updated)
UPDATE  | SS-RINGS-LOTUS-001-S8| 3500          | 25  (updated)
```

**Step 5**: Import the modified file

---

### Scenario 3: Mix of CREATE and UPDATE

You can have both CREATE and UPDATE in the same Excel file:

**Products Sheet**:

```
_action | product_id                | product_name        | ...
UPDATE  | 65f1234567890abcdef12345  | Silver Lotus Ring   | (existing product)
CREATE  |                           | New Silver Bracelet | (new product)
UPDATE  | 65f1234567890abcdef12346  | Silver Anklet Chain | (existing product)
```

**Variants Sheet**:

```
_action | sku                  | product_name        | variant_name | ...
UPDATE  | SS-RINGS-LOTUS-001-S7| Silver Lotus Ring   | Size 7       | (update existing)
CREATE  |                      | New Silver Bracelet | Small        | (create new)
CREATE  |                      | New Silver Bracelet | Medium       | (create new)
UPDATE  | SS-ANKLET-CHAIN-001-9| Silver Anklet Chain | 9 inch       | (update existing)
```

**System behavior**:

-   Updates existing products/variants
-   Creates new products/variants
-   Validates everything before importing
-   If ANY error, NOTHING is imported (transaction rollback)

**⚠️ IMPORTANT: Partial Updates for UPDATE Action**

When using UPDATE action, **empty cells are IGNORED** (data preserved):

```
Example: Updating only price for a variant

_action | sku                  | variant_name | selling_price | weight | description
UPDATE  | SS-RINGS-LOTUS-001-S7|              | 2500          |        |

Result:
✅ selling_price updated to 2500
✅ variant_name remains unchanged (not cleared)
✅ weight remains unchanged (not cleared)
✅ description remains unchanged (not cleared)
```

**This prevents accidental data loss!** You only need to fill in the columns you want to update.

**Contrast with CREATE action** (all fields required):

```
_action | product_name    | variant_name | selling_price | weight | ...
CREATE  | Silver Bracelet | Medium       | 3500          | 15.5   | (all required fields must be filled)
```

---

### Scenario 4: Attributes Format

Variants can have multiple attributes:

```
attributes: "Size:7; Color:Silver; Material:925 Sterling Silver"
```

**Format Rules**:

-   Semicolon (`;`) separates different attributes
-   Colon (`:`) separates key and value
-   Spaces are trimmed automatically

**Examples**:

```
Size:7
Size:7; Color:Silver
Length:9 inch; Width:3mm; Color:Oxidized Silver
Color:Rose Gold; Style:Minimalist
```

---

## Excel File Format

### Sheet Structure

Every Excel file MUST have these 3 sheets:

1. **Products** - Main product information
2. **Variants** - Product variant information
3. **Reference** - Field documentation (optional, for reference only)

### Column Headers

**Products Sheet Headers**:

```
_action, product_id, product_name, slug, category, subcategory,
description, short_description, purity, making_charges_per_gram,
gst_rate, collections, is_featured, is_active, tags, is_hallmarked,
bis_license_number, hallmarking_center, purity_certified, gemstone,
occasion, gender, plating, meta_title, meta_description, meta_keywords
```

**Variants Sheet Headers**:

```
_action, product_name, sku, variant_name, attributes, weight,
length, width, height, mrp, selling_price, cost_price,
stock_quantity, low_stock_threshold, sort_order, is_active
```

### Column Order

✅ **Columns can be in ANY order**

The system uses column header names, not positions. Feel free to:

-   Rearrange columns as you prefer
-   Remove columns you don't need
-   Add columns in between

### Required Columns

**For Products Sheet**:

-   Minimum: `_action`, `product_id`, `product_name`

**For Variants Sheet**:

-   Minimum: `_action`, `product_name`

The validator will check for additional required fields based on the action (CREATE vs UPDATE).

---

## Error Handling

### Error Types

#### 1. File Upload Errors

**Invalid File Type**:

```json
{
    "success": false,
    "message": "Invalid file type. Only .xlsx and .xls files are allowed."
}
```

**File Too Large**:

```json
{
    "success": false,
    "message": "File size exceeds 10MB limit"
}
```

**No File Uploaded**:

```json
{
    "success": false,
    "message": "No file uploaded"
}
```

#### 2. Excel Structure Errors

**Missing Required Sheet**:

```json
{
    "success": false,
    "message": "Worksheet 'Products' not found in Excel file"
}
```

**Missing Required Columns**:

```json
{
    "success": false,
    "message": "Missing required columns in Products sheet: _action, product_name"
}
```

#### 3. Validation Errors

**Field-Level Errors**:

```json
{
    "row": 3,
    "sheet": "Products",
    "action": "CREATE",
    "productName": "Silver Ring",
    "errors": [
        {
            "field": "purity",
            "message": "purity is required"
        },
        {
            "field": "making_charges_per_gram",
            "message": "making_charges_per_gram must be between 0 and 100000"
        }
    ]
}
```

**Reference Errors**:

```json
{
    "row": 5,
    "sheet": "Products",
    "errors": [
        {
            "field": "category",
            "message": "Category \"InvalidCategory\" does not exist in database"
        }
    ]
}
```

**Duplicate Errors**:

```json
{
    "row": 8,
    "sheet": "Variants",
    "errors": [
        {
            "field": "sku",
            "message": "Duplicate SKU \"SS-RING-001-S7\" found (also in row 5)"
        }
    ]
}
```

#### 4. Import Errors

**Transaction Rollback**:
If ANY error occurs during import, the entire transaction is rolled back. Nothing is saved to the database.

```json
{
    "success": false,
    "message": "Import failed: Product not found for update: 65f1234567890abcdef12345",
    "error": "Transaction rolled back"
}
```

---

## Best Practices

### 1. Always Start with Template

Download the template first to ensure you have the correct structure and field names.

### 2. Test with Small Batch

Before importing 1000 products, test with 2-3 products first to ensure your data is valid.

### 3. Use Export for Updates

When updating existing products:

1. Export current data
2. Modify in Excel
3. Import back

This ensures you have correct product IDs and SKUs.

### 4. Check Categories First

Ensure all categories and subcategories exist before importing. Category names are case-insensitive but must match exactly.

### 5. Validate Before Upload

Check your Excel file:

-   ✅ All required fields filled
-   ✅ Data types correct (numbers, TRUE/FALSE, etc.)
-   ✅ No special characters in product names
-   ✅ Category names match database
-   ✅ Product names in Variants sheet match Products sheet

### 6. Keep Backup

Always keep a backup of your Excel file before importing, especially for updates.

### 7. Use Meaningful Names

Use clear, descriptive product and variant names:

-   ✅ Good: "Silver Lotus Ring Size 7"
-   ❌ Bad: "Prod-001-v1"

### 8. Consistent Formatting

Maintain consistent formatting:

-   Boolean: Always use TRUE/FALSE (uppercase)
-   Arrays: Always comma-separated
-   Attributes: Always "key:value; key:value"

### 9. Partial Updates (UPDATE Action Only)

**Empty cells during UPDATE are IGNORED** - existing data is preserved:

-   ✅ Fill only columns you want to change
-   ✅ Leave other columns empty to keep existing values
-   ❌ Don't fill empty cells with "N/A" or "-" (will be stored as text)

**Example**: Update only price and stock:

```
_action | sku                  | selling_price | stock_quantity | description | weight
UPDATE  | SS-RINGS-LOTUS-001-S7| 2500          | 50             |             |

Result: Price and stock updated, description and weight unchanged
```

### 10. Monitor Operations

After import, check the operation status to ensure everything was successful:

```http
GET /api/admin/bulk-operations/:operationId
```

### 11. Review Errors Carefully

If validation fails, review ALL errors before fixing. Don't fix one error and re-upload immediately - you might have multiple issues.

---

## Troubleshooting

### Issue 1: "Category not found"

**Cause**: Category name doesn't match database exactly

**Solution**:

1. Get list of categories: `GET /api/categories`
2. Use EXACT category name (case-insensitive)
3. Check for extra spaces

Example:

-   ❌ "Ring" (wrong)
-   ✅ "Rings" (correct)

---

### Issue 2: "Product not found for variant"

**Cause**: product_name in Variants sheet doesn't match any product in Products sheet

**Solution**:

1. Ensure product_name is exactly the same in both sheets
2. Check for typos
3. Check for extra spaces

Example:

```
Products sheet:  "Silver Lotus Ring"
Variants sheet:  "Silver Lotus Ring" ✅
Variants sheet:  "Silver Lotus  Ring" ❌ (extra space)
```

---

### Issue 3: "Invalid product_id format"

**Cause**: product_id is not a valid MongoDB ObjectId

**Solution**:

1. For CREATE: Leave product_id EMPTY
2. For UPDATE: Export first to get correct IDs
3. ObjectId format: 24 hexadecimal characters

Example:

-   ❌ "123456"
-   ❌ "product-001"
-   ✅ "65f1234567890abcdef12345"

---

### Issue 4: "MRP cannot be less than selling price"

**Cause**: MRP value is lower than selling_price

**Solution**:
Either:

-   Increase MRP
-   Decrease selling_price
-   Leave MRP empty (optional field)

---

### Issue 5: Import succeeds but no data

**Cause**: All data was marked as UPDATE but IDs don't exist

**Solution**:

1. Check \_action column
2. For new products, use CREATE not UPDATE
3. Verify product_id and sku are correct for UPDATE

---

### Issue 6: "Duplicate SKU found"

**Cause**: Same SKU appears multiple times in Variants sheet with UPDATE action

**Solution**:

1. Each SKU must be unique
2. For CREATE, leave SKU empty (auto-generated)
3. For UPDATE, ensure each SKU appears only once

---

### Issue 7: File upload fails silently

**Cause**: File size exceeds 10MB

**Solution**:

1. Split large files into smaller batches
2. Remove unnecessary columns
3. Import in multiple operations

---

### Issue 8: "Validation passed but import failed"

**Cause**: Data changed between validation and import (rare)

**Solution**:

1. Re-download template
2. Re-export current data
3. Try import again

---

### Issue 9: Can't find downloaded export file

**Cause**: Export URL expired or file not found

**Solution**:

1. Files expire after 7 days
2. Export again if needed
3. Download immediately after export

---

### Issue 10: Special characters causing issues

**Cause**: Product names contain problematic characters

**Solution**:
Allowed characters in product names:

-   ✅ Letters (A-Z, a-z)
-   ✅ Numbers (0-9)
-   ✅ Spaces
-   ✅ Hyphens (-) and underscores (\_)
-   ✅ Ampersand (&)
-   ✅ Parentheses ()
-   ✅ Commas (,) and periods (.)

Avoid:

-   ❌ Quotes (", ')
-   ❌ Slashes (/, \)
-   ❌ Asterisks (\*)
-   ❌ Special symbols (@, #, $, %)

---

## Quick Reference

### Field Requirement Summary

**CREATE Product**:

-   Required: product_name, category, purity, making_charges_per_gram
-   Auto-generated: slug, images (empty)
-   All fields: Filled with values or defaults

**UPDATE Product**:

-   Required: product_id
-   Optional: Any other fields to update
-   **Empty cells**: IGNORED (existing data preserved)

**CREATE Variant**:

-   Required: product_name, variant_name, weight, selling_price
-   Auto-generated: sku
-   All fields: Filled with values or defaults

**UPDATE Variant**:

-   Required: sku
-   Optional: Any other fields to update
-   **Empty cells**: IGNORED (existing data preserved)

---

### Common Data Formats

```
Boolean:    TRUE, FALSE
Purity:     925, 999
Gender:     men, women, unisex
Arrays:     value1, value2, value3
Attributes: key:value; key:value
```

---

### Error Prevention Checklist

Before importing:

-   [ ] Downloaded latest template
-   [ ] All required fields filled for CREATE action
-   [ ] For UPDATE: Only identifier (product_id/sku) + fields to change
-   [ ] Category names verified
-   [ ] Product names match in Variants sheet
-   [ ] Boolean values are TRUE/FALSE
-   [ ] Number fields contain valid numbers
-   [ ] MRP ≥ selling_price (if provided)
-   [ ] For UPDATE: product_id and sku are correct
-   [ ] For CREATE: product_id and sku are empty
-   [ ] **UPDATE: Empty cells left blank (not "N/A" or "-")**
-   [ ] File size < 10MB
-   [ ] File format is .xlsx or .xls

---

## Support

For issues or questions:

1. Check this documentation
2. Review error messages carefully
3. Test with template examples
4. Contact system administrator

---

## Changelog

### Version 1.2.0 (2026-01-16)

**Major Updates:**

-   ✅ **Duplicate Product Name Prevention**: System now blocks duplicate product names during CREATE
    -   Checks database for existing products
    -   Detects duplicates within the same Excel file
    -   Provides clear error messages with product IDs
-   ✅ **Partial Updates Enhanced**: Empty cells during UPDATE are now safely ignored
    -   Only filled fields are updated
    -   No risk of accidental data loss
    -   Maintains data integrity
-   ✅ **Auto-Slug Generation**: Product slugs automatically generated from product name
    -   Maintains consistency with regular product API
    -   Handles duplicate slug conflicts automatically
-   ✅ **Export Optimization**: Files no longer stored in codebase
    -   Direct buffer streaming to client
    -   No filesystem pollution
    -   Improved performance
-   ✅ **Images Validation Bypass**: Bulk operations properly skip image requirements
    -   Empty images array allowed for CREATE
    -   Images must be added via regular API after import

**Bug Fixes:**

-   Fixed array handling for collections, tags, and meta_keywords
-   Fixed category/subcategory population in exports
-   Fixed validation property name mismatch (valid vs isValid)
-   Removed filesystem storage for export files

### Version 1.1.0 (2026-01-15)

-   **IMPORTANT**: Implemented partial updates for UPDATE action
-   Empty cells now IGNORED during UPDATE (prevents data loss)
-   Only filled fields are updated, empty cells preserve existing data
-   Updated documentation with partial update examples

### Version 1.0.0 (2026-01-15)

-   Initial release
-   Support for Products and ProductVariants
-   Auto SKU generation
-   Transaction support
-   Two-phase validation
-   Excel import/export

---

## System Updates

-   Two-phase validation
-   Export with filters
-   Operation tracking
