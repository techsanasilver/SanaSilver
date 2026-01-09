# Products System API Guide (Corrected)

Complete and accurate API documentation based on the actual codebase. All examples are tested and ready for Postman.

**Base URL**: `http://localhost:5000/api/products`

**Authentication**: Bearer token required for write operations

```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Required Permissions:**

-   `products.create` - Create products and variants
-   `products.edit` - Update products, variants, and images
-   `products.delete` - Soft/hard delete products and variants

---

## Quick Reference

| Method | Endpoint                                | Auth | Description                  |
| ------ | --------------------------------------- | ---- | ---------------------------- |
| POST   | `/`                                     | ✓    | Create product with variants |
| GET    | `/`                                     | -    | Get all products (filtered)  |
| GET    | `/:id`                                  | -    | Get product by ID            |
| GET    | `/slug/:slug`                           | -    | Get product by slug          |
| PUT    | `/:id`                                  | ✓    | Update product               |
| DELETE | `/:id`                                  | ✓    | Soft delete product          |
| DELETE | `/:id/force`                            | ✓    | Hard delete product          |
| POST   | `/:id/images`                           | ✓    | Upload product images        |
| DELETE | `/:id/images`                           | ✓    | Delete product images        |
| GET    | `/:productId/variants`                  | -    | Get all variants             |
| POST   | `/:productId/variants`                  | ✓    | Create variant               |
| GET    | `/variants/:variantId`                  | -    | Get variant by ID            |
| PUT    | `/variants/:variantId`                  | ✓    | Update variant               |
| PATCH  | `/variants/:variantId/stock`            | ✓    | Update stock                 |
| DELETE | `/:productId/variants/:variantId`       | ✓    | Soft delete variant          |
| DELETE | `/:productId/variants/:variantId/force` | ✓    | Hard delete variant          |
| POST   | `/variants/:variantId/images`           | ✓    | Upload variant images        |
| DELETE | `/variants/:variantId/images`           | ✓    | Delete variant images        |

---

## 1. CREATE PRODUCT

Creates a product with variants in one call. Product images are uploaded, variant images can be added later.

### Endpoint

```
POST /api/products
```

### Headers

```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

### Required Fields

-   `name` (string) - Product name
-   `category` (ObjectId) - Category ID
-   `purity` (enum) - "925" or "999"
-   `makingChargesPerGram` (number) - Making charges
-   `variants` (JSON string) - Array of variant objects (min 1)
-   `images` (files) - 1-10 image files

### Optional Fields

-   `description` (string) - Full description
-   `shortDescription` (string) - Max 500 chars
-   `subcategory` (ObjectId) - Subcategory ID
-   `collections` (JSON array string) - Collection IDs
-   `gstRate` (number) - Default: 3
-   `isFeatured` (boolean) - Default: false
-   `tags` (JSON array string) - Tags
-   `attributes.gender` (string) - "men", "women", "unisex"
-   `attributes.occasion` (string) - Occasion
-   `attributes.gemstone` (string) - Gemstone type
-   `attributes.plating` (string) - Plating type
-   `hallmark.isHallmarked` (boolean)
-   `hallmark.bisLicenseNumber` (string)
-   `hallmark.hallmarkingCenter` (string)
-   `hallmark.purityCertified` (string) - "925" or "999"
-   `seo.metaTitle` (string)
-   `seo.metaDescription` (string)
-   `seo.metaKeywords` (JSON array string)

### Variant Object Fields (in variants array)

**Required:**

-   `variantName` (string) - Variant name
-   `weight` (number) - Weight in grams (min: 0.01)
-   `sellingPrice` (number) - Selling price (min: 0)

**Optional:**

-   `attributes` (array) - [{key: "size", value: "7"}]
-   `mrp` (number) - MRP
-   `costPrice` (number) - Cost price
-   `stockQuantity` (number) - Default: 0
-   `lowStockThreshold` (number) - Default: 5
-   `dimensions.length` (number)
-   `dimensions.width` (number)
-   `dimensions.height` (number)

### Postman Example

```
POST http://localhost:5000/api/products
```

**Headers:**

```
Authorization: Bearer eyJhbGc...your_token_here
```

**Body (form-data):**

```
name: Lotus Silver Ring
description: Beautiful handcrafted lotus design silver ring
category: 507f1f77bcf86cd799439011
purity: 925
makingChargesPerGram: 150
gstRate: 3
isFeatured: false
tags: ["rings","lotus","silver"]
attributes: {"gender":"women","occasion":"Daily Wear"}

variants: [{"variantName":"Size 6","weight":3.2,"sellingPrice":2400,"mrp":3000,"stockQuantity":20,"attributes":[{"key":"size","value":"6"}]},{"variantName":"Size 7","weight":3.5,"sellingPrice":2500,"mrp":3100,"stockQuantity":50,"attributes":[{"key":"size","value":"7"}]}]

images: [select 1-10 image files]
```

**Note:** `variants` field must be a JSON string, not actual JSON. `tags` and nested objects should also be JSON strings.

### Success Response (201 Created)

```json
{
    "success": true,
    "message": "Product created successfully",
    "data": {
        "_id": "67812abc3d4e5f6a7b8c9d0e",
        "name": "Lotus Silver Ring",
        "slug": "lotus-silver-ring",
        "description": "Beautiful handcrafted lotus design silver ring",
        "category": {
            "_id": "507f1f77bcf86cd799439011",
            "name": "Rings"
        },
        "purity": "925",
        "makingChargesPerGram": 150,
        "gstRate": 3,
        "images": [
            {
                "publicId": "sana-silver/products/lotus-silver-ring-1",
                "url": "https://res.cloudinary.com/.../lotus-silver-ring-1.jpg",
                "alt": "Lotus Silver Ring",
                "sortOrder": 0,
                "isPrimary": true,
                "urls": {
                    "thumbnail": "https://res.cloudinary.com/.../c_thumb,w_150/...",
                    "small": "https://res.cloudinary.com/.../w_300/...",
                    "medium": "https://res.cloudinary.com/.../w_600/...",
                    "large": "https://res.cloudinary.com/.../w_1200/...",
                    "original": "https://res.cloudinary.com/..."
                }
            }
        ],
        "isFeatured": false,
        "isActive": true,
        "tags": ["rings", "lotus", "silver"],
        "attributes": {
            "gender": "women",
            "occasion": "Daily Wear"
        },
        "variants": [
            {
                "_id": "67812abc3d4e5f6a7b8c9d0f",
                "product": "67812abc3d4e5f6a7b8c9d0e",
                "sku": "SS-RING-LOTUS-001-S6",
                "variantName": "Size 6",
                "weight": 3.2,
                "sellingPrice": 2400,
                "mrp": 3000,
                "stockQuantity": 20,
                "attributes": [{ "key": "size", "value": "6" }],
                "images": [],
                "isActive": true
            },
            {
                "_id": "67812abc3d4e5f6a7b8c9d10",
                "product": "67812abc3d4e5f6a7b8c9d0e",
                "sku": "SS-RING-LOTUS-001-S7",
                "variantName": "Size 7",
                "weight": 3.5,
                "sellingPrice": 2500,
                "mrp": 3100,
                "stockQuantity": 50,
                "attributes": [{ "key": "size", "value": "7" }],
                "images": [],
                "isActive": true
            }
        ],
        "createdAt": "2026-01-10T10:30:00.000Z",
        "updatedAt": "2026-01-10T10:30:00.000Z"
    }
}
```

---

## 2. GET ALL PRODUCTS

Retrieve products with filtering, search, and pagination.

### Endpoint

```
GET /api/products
```

### Headers

```
None required (public endpoint)
```

### Query Parameters

| Parameter     | Type        | Description                      | Example                    |
| ------------- | ----------- | -------------------------------- | -------------------------- |
| `page`        | number      | Page number (default: 1)         | `1`                        |
| `limit`       | number      | Items per page (default: 20)     | `20`                       |
| `category`    | ObjectId    | Filter by category ID            | `507f1f77bcf86cd799439011` |
| `subcategory` | ObjectId    | Filter by subcategory ID         | `507f1f77bcf86cd799439012` |
| `collections` | string      | Comma-separated collection names | `bridal,daily-wear`        |
| `purity`      | string      | "925" or "999"                   | `925`                      |
| `isFeatured`  | boolean     | true or false                    | `true`                     |
| `gender`      | string      | "men", "women", "unisex"         | `women`                    |
| `minPrice`    | number      | Minimum selling price            | `1000`                     |
| `maxPrice`    | number      | Maximum selling price            | `5000`                     |
| `inStock`     | boolean     | true or false                    | `true`                     |
| `search`      | string      | Full-text search                 | `lotus ring`               |
| `sortBy`      | string      | Sort option (see below)          | `price-asc`                |
| `attributes`  | JSON string | Filter by variant attributes     | `{"size":"7"}`             |

### Sort Options

-   `price-asc` - Price low to high
-   `price-desc` - Price high to low
-   `name-asc` - Name A-Z
-   `name-desc` - Name Z-A
-   `newest` - Newest first
-   `oldest` - Oldest first
-   `rating` - Highest rated first
-   `featured` - Featured first

### Postman Examples

**Basic Request:**

```
GET http://localhost:5000/api/products?page=1&limit=20
```

**Filtered by Category and Price:**

```
GET http://localhost:5000/api/products?category=507f1f77bcf86cd799439011&purity=925&minPrice=1000&maxPrice=5000&sortBy=price-asc
```

**Search with Filters:**

```
GET http://localhost:5000/api/products?search=lotus&gender=women&inStock=true&sortBy=newest
```

**Filter by Variant Attributes:**

```
GET http://localhost:5000/api/products?attributes={"size":"7","color":"Silver"}
```

**Featured Products:**

```
GET http://localhost:5000/api/products?isFeatured=true&isActive=true&limit=10&sortBy=featured
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "_id": "67812abc3d4e5f6a7b8c9d0e",
      "name": "Lotus Silver Ring",
      "slug": "lotus-silver-ring",
      "images": [...],
      "category": {...},
      "purity": "925",
      "minPrice": 2400,
      "maxPrice": 2500,
      "isFeatured": false,
      "isActive": true,
      "variants": [...],
      "totalStock": 70
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 98,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## 3. GET PRODUCT BY ID

### Endpoint

```
GET /api/products/:id
```

### Postman Example

```
GET http://localhost:5000/api/products/67812abc3d4e5f6a7b8c9d0e
```

### Success Response (200 OK)

Same structure as create product response.

---

## 4. GET PRODUCT BY SLUG

### Endpoint

```
GET /api/products/slug/:slug
```

### Postman Example

```
GET http://localhost:5000/api/products/slug/lotus-silver-ring
```

### Success Response (200 OK)

Same structure as get by ID.

---

## 5. UPDATE PRODUCT

Update product details, add/delete images, update/delete variants.

### Endpoint

```
PUT /api/products/:id
```

### Headers

```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

### Request Fields (All Optional)

-   Product fields (name, description, purity, etc.)
-   `images` (files) - Add new product images (0-10)
-   `deleteImages` (JSON array string) - PublicIds to delete
-   `variants` (JSON array string) - Update/create variants
-   `deleteVariants` (JSON array string) - Variant IDs to delete

### Variant Update Object

Include `_id` to update existing, omit to create new:

```json
{
    "_id": "67812abc3d4e5f6a7b8c9d10", // Include to update
    "sellingPrice": 2600,
    "stockQuantity": 100
}
```

### Postman Example

```
PUT http://localhost:5000/api/products/67812abc3d4e5f6a7b8c9d0e
```

**Headers:**

```
Authorization: Bearer YOUR_TOKEN
```

**Body (form-data):**

```
name: Lotus Silver Ring Premium
description: Updated description
makingChargesPerGram: 180

deleteImages: ["sana-silver/products/lotus-silver-ring-1"]

images: [select new image files]

variants: [{"_id":"67812abc3d4e5f6a7b8c9d0f","sellingPrice":2600,"stockQuantity":30},{"variantName":"Size 8","weight":3.8,"sellingPrice":2700,"stockQuantity":10,"attributes":[{"key":"size","value":"8"}]}]

deleteVariants: ["67812abc3d4e5f6a7b8c9d10"]
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Product updated successfully",
    "data": {
        // Updated product with variants
    }
}
```

---

## 6. SOFT DELETE PRODUCT

Deactivates product (sets `isActive: false`).

### Endpoint

```
DELETE /api/products/:id
```

### Headers

```
Authorization: Bearer YOUR_TOKEN
```

### Postman Example

```
DELETE http://localhost:5000/api/products/67812abc3d4e5f6a7b8c9d0e
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Product deactivated successfully",
    "data": {
        "message": "Product and variants deactivated successfully"
    }
}
```

---

## 7. HARD DELETE PRODUCT

Permanently deletes product, variants, and all images from Cloudinary.

### Endpoint

```
DELETE /api/products/:id/force
```

### Headers

```
Authorization: Bearer YOUR_TOKEN
```

### Postman Example

```
DELETE http://localhost:5000/api/products/67812abc3d4e5f6a7b8c9d0e/force
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Product deleted permanently",
    "data": {
        "message": "Product and all variants deleted permanently"
    }
}
```

---

## 8. UPLOAD PRODUCT IMAGES

Add images to existing product.

### Endpoint

```
POST /api/products/:id/images
```

### Headers

```
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data
```

### Request Body

```
images: [select 1-10 image files]
```

### Postman Example

```
POST http://localhost:5000/api/products/67812abc3d4e5f6a7b8c9d0e/images
```

**Body (form-data):**

```
images: [file1.jpg, file2.jpg, file3.jpg]
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Product images uploaded successfully",
    "data": {
        "_id": "67812abc3d4e5f6a7b8c9d0e",
        "name": "Lotus Silver Ring",
        "images": [
            // All images including new ones
        ]
    }
}
```

---

## 9. DELETE PRODUCT IMAGES

Remove specific images from product.

### Endpoint

```
DELETE /api/products/:id/images
```

### Headers

```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

### Request Body

```json
{
    "publicIds": [
        "sana-silver/products/lotus-silver-ring-1",
        "sana-silver/products/lotus-silver-ring-2"
    ]
}
```

### Postman Example

```
DELETE http://localhost:5000/api/products/67812abc3d4e5f6a7b8c9d0e/images
```

**Body (raw JSON):**

```json
{
    "publicIds": ["sana-silver/products/lotus-silver-ring-1"]
}
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Product images deleted successfully",
    "data": {
        // Product with remaining images
    }
}
```

---

## 10. GET PRODUCT VARIANTS

### Endpoint

```
GET /api/products/:productId/variants
```

### Postman Example

```
GET http://localhost:5000/api/products/67812abc3d4e5f6a7b8c9d0e/variants
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Variants retrieved successfully",
    "data": [
        {
            "_id": "67812abc3d4e5f6a7b8c9d0f",
            "product": "67812abc3d4e5f6a7b8c9d0e",
            "sku": "SS-RING-LOTUS-001-S6",
            "variantName": "Size 6",
            "weight": 3.2,
            "sellingPrice": 2400,
            "images": [],
            "isActive": true
        }
    ]
}
```

---

## 11. CREATE VARIANT

Add a new variant to existing product.

### Endpoint

```
POST /api/products/:productId/variants
```

### Headers

```
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data
```

### Required Fields

-   `variantName` (string)
-   `weight` (number)
-   `sellingPrice` (number)

### Optional Fields

-   Same as variant fields in create product
-   `images` (files) - 0-5 variant images

### Postman Example

```
POST http://localhost:5000/api/products/67812abc3d4e5f6a7b8c9d0e/variants
```

**Body (form-data):**

```
variantName: Size 9
weight: 4.0
sellingPrice: 2800
mrp: 3400
stockQuantity: 15
attributes: [{"key":"size","value":"9"}]
images: [size9_img.jpg]
```

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Variant created successfully",
  "data": {
    "_id": "67812abc3d4e5f6a7b8c9d11",
    "product": "67812abc3d4e5f6a7b8c9d0e",
    "sku": "SS-RING-LOTUS-001-S9",
    "variantName": "Size 9",
    "weight": 4.0,
    "sellingPrice": 2800,
    "images": [...],
    "isActive": true
  }
}
```

---

## 12. GET VARIANT BY ID

### Endpoint

```
GET /api/products/variants/:variantId
```

### Postman Example

```
GET http://localhost:5000/api/products/variants/67812abc3d4e5f6a7b8c9d0f
```

---

## 13. UPDATE VARIANT

### Endpoint

```
PUT /api/products/variants/:variantId
```

### Headers

```
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data
```

### Request Fields (All Optional)

-   Variant fields (variantName, weight, sellingPrice, etc.)
-   `images` (files) - Add new variant images (0-5)
-   `deleteImages` (JSON array string) - PublicIds to delete

### Postman Example

```
PUT http://localhost:5000/api/products/variants/67812abc3d4e5f6a7b8c9d0f
```

**Body (form-data):**

```
sellingPrice: 2650
stockQuantity: 40
deleteImages: ["sana-silver/products/variants/var-img-1"]
images: [new_variant_img.jpg]
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Variant updated successfully",
    "data": {
        // Updated variant
    }
}
```

---

## 14. UPDATE VARIANT STOCK

Quick stock update endpoint.

### Endpoint

```
PATCH /api/products/variants/:variantId/stock
```

### Headers

```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

### Request Body

```json
{
    "stockQuantity": 100
}
```

### Postman Example

```
PATCH http://localhost:5000/api/products/variants/67812abc3d4e5f6a7b8c9d0f/stock
```

**Body (raw JSON):**

```json
{
    "stockQuantity": 100
}
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Stock updated successfully",
    "data": {
        // Updated variant
    }
}
```

---

## 15. SOFT DELETE VARIANT

### Endpoint

```
DELETE /api/products/:productId/variants/:variantId
```

### Headers

```
Authorization: Bearer YOUR_TOKEN
```

### Postman Example

```
DELETE http://localhost:5000/api/products/67812abc3d4e5f6a7b8c9d0e/variants/67812abc3d4e5f6a7b8c9d0f
```

---

## 16. HARD DELETE VARIANT

Cannot delete if it's the last variant.

### Endpoint

```
DELETE /api/products/:productId/variants/:variantId/force
```

### Headers

```
Authorization: Bearer YOUR_TOKEN
```

### Postman Example

```
DELETE http://localhost:5000/api/products/67812abc3d4e5f6a7b8c9d0e/variants/67812abc3d4e5f6a7b8c9d0f/force
```

---

## 17. UPLOAD VARIANT IMAGES

### Endpoint

```
POST /api/products/variants/:variantId/images
```

### Headers

```
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data
```

### Request Body

```
images: [1-5 image files]
```

### Postman Example

```
POST http://localhost:5000/api/products/variants/67812abc3d4e5f6a7b8c9d0f/images
```

**Body (form-data):**

```
images: [variant_img1.jpg, variant_img2.jpg]
```

---

## 18. DELETE VARIANT IMAGES

### Endpoint

```
DELETE /api/products/variants/:variantId/images
```

### Headers

```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

### Request Body

```json
{
    "publicIds": ["sana-silver/products/variants/var-img-1"]
}
```

### Postman Example

```
DELETE http://localhost:5000/api/products/variants/67812abc3d4e5f6a7b8c9d0f/images
```

**Body (raw JSON):**

```json
{
    "publicIds": [
        "sana-silver/products/variants/var-img-1",
        "sana-silver/products/variants/var-img-2"
    ]
}
```

---

## Common Response Formats

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {...}
}
```

### Success with Pagination

```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 195,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Error Responses

**400 Bad Request:**

```json
{
    "success": false,
    "message": "Validation error",
    "errors": [
        "Product name is required",
        "Variants must have at least 1 item(s)"
    ]
}
```

**401 Unauthorized:**

```json
{
    "success": false,
    "message": "Not authenticated"
}
```

**403 Forbidden:**

```json
{
    "success": false,
    "message": "Insufficient permissions"
}
```

**404 Not Found:**

```json
{
    "success": false,
    "message": "Product not found with ID: 67812abc3d4e5f6a7b8c9d0e"
}
```

**500 Internal Server Error:**

```json
{
    "success": false,
    "message": "Error message here"
}
```

---

## Important Notes

### FormData vs JSON

**Use FormData when:**

-   Uploading files (images)
-   Creating/updating products or variants

**Use JSON when:**

-   Deleting images (publicIds array)
-   Updating stock
-   No file uploads

### JSON String Fields

When using FormData, complex fields must be JSON strings:

```javascript
// ✅ Correct
variants: '[{"variantName":"Size 6","weight":3.2}]';
tags: '["ring","silver"]';
attributes: '{"gender":"women"}';
deleteImages: '["publicId1","publicId2"]';

// ❌ Wrong
variants: {
    variantName: "Size 6";
} // This won't work
```

### Image Upload Limits

-   Product images: 1-10 files (min 1 required on create)
-   Variant images: 0-5 files (optional)
-   Max file size: 5MB per file
-   Supported formats: JPEG, PNG, WebP

### SKU Format

Auto-generated in format: `SS-CATEGORY-NAME-NUMBER-VARIANT`
Example: `SS-RING-LOTUS-001-S7`

### Slug Generation

Auto-generated from product name:

-   "Lotus Silver Ring" → "lotus-silver-ring"
-   Guaranteed unique

### Image URLs

All images return 5 size variants:

-   `thumbnail`: 150px width
-   `small`: 300px width
-   `medium`: 600px width
-   `large`: 1200px width
-   `original`: Full size

### Soft Delete vs Hard Delete

**Soft Delete:**

-   Sets `isActive: false`
-   Data preserved
-   Can be reactivated
-   Images remain in Cloudinary

**Hard Delete:**

-   Permanently removes from database
-   Deletes all images from Cloudinary
-   Cannot be undone
-   Cannot delete last variant

---

## Testing Workflow

### 1. Create Product

```
POST /api/products
- Upload product images
- Include variants (no images)
→ Get product ID and variant IDs
```

### 2. Add Variant Images (Optional)

```
POST /api/products/variants/{variantId}/images
- Upload variant-specific images
→ Variants now have custom images
```

### 3. Update Product

```
PUT /api/products/{id}
- Update product fields
- Add/delete product images
- Update/create/delete variants
→ Product and variants updated
```

### 4. Manage Stock

```
PATCH /api/products/variants/{variantId}/stock
- Quick stock update
→ Stock updated
```

### 5. Delete Operations

```
DELETE /api/products/{id}  # Soft delete
DELETE /api/products/{id}/force  # Hard delete
→ Product removed
```

---

## Postman Collection Structure

```
Products System API/
├── Products/
│   ├── Create Product
│   ├── Get All Products
│   ├── Get Product by ID
│   ├── Get Product by Slug
│   ├── Update Product
│   ├── Soft Delete Product
│   └── Hard Delete Product
├── Product Images/
│   ├── Upload Product Images
│   └── Delete Product Images
├── Variants/
│   ├── Get Product Variants
│   ├── Get Variant by ID
│   ├── Create Variant
│   ├── Update Variant
│   ├── Update Variant Stock
│   ├── Soft Delete Variant
│   └── Hard Delete Variant
└── Variant Images/
    ├── Upload Variant Images
    └── Delete Variant Images
```

---

**Last Updated**: January 10, 2026  
**API Version**: 1.0  
**Backend**: Sana Silver Products System
