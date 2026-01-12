# BANNERS API GUIDE

Complete API documentation for the Banners feature.

---

## BASE URL

```
/api/banners
```

---

## AUTHENTICATION

-   **Public Routes**: GET endpoints (fetch banners)
-   **Protected Routes**: POST, PUT, PATCH, DELETE (requires authentication)
-   **Auth Method**: JWT token in httpOnly cookie

---

## BANNER SCHEMA

```javascript
{
  _id: ObjectId,
  title: String (required, max 100 chars),
  subtitle: String (optional, max 200 chars),
  link: {
    type: String (enum: "internal" | "external", default: "internal"),
    url: String (optional)
  },
  buttonText: String (optional, max 50 chars),
  displayLocation: String (enum: "home" | "shop" | "about" | "contact" | "all", default: "home"),
  sortOrder: Number (default: 0),
  isActive: Boolean (default: true),
  startDate: Date (optional),
  endDate: Date (optional),
  desktopImage: {
    publicId: String (required),
    url: String (required),
    alt: String,
    urls: {
      thumbnail: String,
      small: String,
      medium: String,
      large: String,
      original: String
    }
  },
  mobileImage: {
    publicId: String (optional),
    url: String (optional),
    alt: String,
    urls: {
      thumbnail: String,
      small: String,
      medium: String,
      large: String,
      original: String
    }
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## API ENDPOINTS

### 1. CREATE BANNER

**POST** `/api/banners`

**Access**: Private (Admin)

**Content-Type**: `multipart/form-data`

**Request Body**:

```javascript
{
  // Text Fields
  title: "Summer Sale 2026",              // Required, max 100 chars
  subtitle: "Get 50% off on all items",   // Optional, max 200 chars
  link: JSON.stringify({                   // Optional, must be JSON string
    type: "internal",                      // "internal" | "external"
    url: "/shop/sale"
  }),
  buttonText: "Shop Now",                  // Optional, max 50 chars
  displayLocation: "home",                 // "home" | "shop" | "about" | "contact" | "all"
  sortOrder: 0,                            // Number, default: 0
  isActive: true,                          // Boolean, default: true
  startDate: "2026-06-01T00:00:00Z",      // ISO date string (optional)
  endDate: "2026-08-31T23:59:59Z",        // ISO date string (optional)

  // Image Files
  images: [File, File]                     // Array: [desktopImage (required), mobileImage (optional)]
}
```

**Example using FormData**:

```javascript
const formData = new FormData();
formData.append("title", "Summer Sale 2026");
formData.append("subtitle", "Get 50% off on all items");
formData.append(
    "link",
    JSON.stringify({
        type: "internal",
        url: "/shop/sale",
    })
);
formData.append("buttonText", "Shop Now");
formData.append("displayLocation", "home");
formData.append("sortOrder", 0);
formData.append("isActive", true);
formData.append("startDate", "2026-06-01T00:00:00Z");
formData.append("endDate", "2026-08-31T23:59:59Z");
formData.append("images", desktopImageFile); // Required
formData.append("images", mobileImageFile); // Optional
```

**Success Response (201)**:

```json
{
    "success": true,
    "statusCode": 201,
    "message": "Banner created successfully",
    "data": {
        "_id": "677e1234567890abcdef1234",
        "title": "Summer Sale 2026",
        "subtitle": "Get 50% off on all items",
        "link": {
            "type": "internal",
            "url": "/shop/sale"
        },
        "buttonText": "Shop Now",
        "displayLocation": "home",
        "sortOrder": 0,
        "isActive": true,
        "startDate": "2026-06-01T00:00:00.000Z",
        "endDate": "2026-08-31T23:59:59.000Z",
        "desktopImage": {
            "publicId": "banner_1234567890_desktop",
            "url": "https://res.cloudinary.com/...",
            "alt": "Summer Sale 2026",
            "urls": {
                "thumbnail": "https://...",
                "small": "https://...",
                "medium": "https://...",
                "large": "https://...",
                "original": "https://..."
            }
        },
        "mobileImage": {
            "publicId": "banner_1234567891_mobile",
            "url": "https://res.cloudinary.com/...",
            "alt": "Summer Sale 2026",
            "urls": {
                "thumbnail": "https://...",
                "small": "https://...",
                "medium": "https://...",
                "large": "https://...",
                "original": "https://..."
            }
        },
        "createdAt": "2026-01-13T10:30:00.000Z",
        "updatedAt": "2026-01-13T10:30:00.000Z"
    },
    "timestamp": "2026-01-13 16:00:00 IST"
}
```

**Error Responses**:

-   **400**: Validation failed, Desktop image required
-   **401**: Unauthorized
-   **422**: Validation error with details
-   **500**: Server error

---

### 2. GET ALL BANNERS

**GET** `/api/banners`

**Access**: Public

**Query Parameters** (all optional):

```
isActive     : Boolean - Filter by active status (true/false)
displayLocation : String - Filter by location ("home" | "shop" | "about" | "contact" | "all")
scheduled    : Boolean - Filter currently scheduled banners (true/false)
```

**Example Requests**:

```
GET /api/banners
GET /api/banners?isActive=true
GET /api/banners?displayLocation=home
GET /api/banners?isActive=true&displayLocation=home
GET /api/banners?scheduled=true
```

**Success Response (200)**:

```json
{
    "success": true,
    "statusCode": 200,
    "message": "Banners fetched successfully",
    "data": {
        "count": 2,
        "banners": [
            {
                "_id": "677e1234567890abcdef1234",
                "title": "Summer Sale 2026",
                "subtitle": "Get 50% off on all items",
                "link": {
                    "type": "internal",
                    "url": "/shop/sale"
                },
                "buttonText": "Shop Now",
                "displayLocation": "home",
                "sortOrder": 0,
                "isActive": true,
                "startDate": "2026-06-01T00:00:00.000Z",
                "endDate": "2026-08-31T23:59:59.000Z",
                "desktopImage": {
                    /* image object */
                },
                "mobileImage": {
                    /* image object */
                },
                "createdAt": "2026-01-13T10:30:00.000Z",
                "updatedAt": "2026-01-13T10:30:00.000Z"
            },
            {
                "_id": "677e1234567890abcdef5678",
                "title": "New Collection Launch"
                // ... other fields
            }
        ]
    },
    "timestamp": "2026-01-13 16:00:00 IST"
}
```

**Error Response**:

-   **500**: Server error

---

### 3. GET BANNER BY ID

**GET** `/api/banners/:id`

**Access**: Public

**URL Parameters**:

```
id : String (MongoDB ObjectId)
```

**Example Request**:

```
GET /api/banners/677e1234567890abcdef1234
```

**Success Response (200)**:

```json
{
    "success": true,
    "statusCode": 200,
    "message": "Banner fetched successfully",
    "data": {
        "_id": "677e1234567890abcdef1234",
        "title": "Summer Sale 2026",
        "subtitle": "Get 50% off on all items",
        "link": {
            "type": "internal",
            "url": "/shop/sale"
        },
        "buttonText": "Shop Now",
        "displayLocation": "home",
        "sortOrder": 0,
        "isActive": true,
        "startDate": "2026-06-01T00:00:00.000Z",
        "endDate": "2026-08-31T23:59:59.000Z",
        "desktopImage": {
            /* image object */
        },
        "mobileImage": {
            /* image object */
        },
        "createdAt": "2026-01-13T10:30:00.000Z",
        "updatedAt": "2026-01-13T10:30:00.000Z"
    },
    "timestamp": "2026-01-13 16:00:00 IST"
}
```

**Error Responses**:

-   **404**: Banner not found
-   **500**: Server error

---

### 4. UPDATE BANNER

**PUT** `/api/banners/:id`

**Access**: Private (Admin)

**Content-Type**: `multipart/form-data`

**URL Parameters**:

```
id : String (MongoDB ObjectId)
```

**Request Body** (all fields optional):

```javascript
{
  // Text Fields (same as create, all optional)
  title: "Updated Summer Sale",
  subtitle: "New subtitle",
  link: JSON.stringify({
    type: "external",
    url: "https://example.com"
  }),
  buttonText: "Learn More",
  displayLocation: "shop",
  sortOrder: 5,
  isActive: false,
  startDate: "2026-07-01T00:00:00Z",
  endDate: "2026-09-30T23:59:59Z",

  // Image Files (optional)
  images: [File, File]  // [desktopImage, mobileImage] - both optional

  // Delete Flags (optional)
  deleteDesktopImage: false,  // Cannot delete without uploading new one
  deleteMobileImage: false     // Cannot delete without uploading new one
}
```

**Example using FormData**:

```javascript
const formData = new FormData();
formData.append("title", "Updated Summer Sale");
formData.append("isActive", false);
// Only upload desktop image
formData.append("images", newDesktopImageFile);
```

**Important Notes**:

-   Images are uploaded BEFORE old ones are deleted (safety pattern)
-   Cannot delete desktop/mobile image without uploading a replacement
-   If you upload images, old ones are automatically replaced
-   Pass only the fields you want to update

**Success Response (200)**:

```json
{
    "success": true,
    "statusCode": 200,
    "message": "Banner updated successfully",
    "data": {
        "_id": "677e1234567890abcdef1234",
        "title": "Updated Summer Sale",
        // ... updated fields
        "updatedAt": "2026-01-13T11:00:00.000Z"
    },
    "timestamp": "2026-01-13 16:30:00 IST"
}
```

**Error Responses**:

-   **400**: Validation failed
-   **401**: Unauthorized
-   **404**: Banner not found
-   **422**: Validation error with details
-   **500**: Server error (including "Cannot delete image without uploading a replacement")

---

### 5. SOFT DELETE BANNER (DEACTIVATE)

**DELETE** `/api/banners/:id`

**Access**: Private (Admin)

**URL Parameters**:

```
id : String (MongoDB ObjectId)
```

**Description**:
Sets `isActive` to `false`. Banner remains in database with all images intact. Can be reactivated later using the status update endpoint.

**Example Request**:

```
DELETE /api/banners/677e1234567890abcdef1234
```

**Success Response (200)**:

```json
{
    "success": true,
    "statusCode": 200,
    "message": "Banner deactivated successfully",
    "data": {
        "_id": "677e1234567890abcdef1234",
        "title": "Summer Sale 2026",
        "isActive": false,
        // ... other fields
        "updatedAt": "2026-01-13T11:30:00.000Z"
    },
    "timestamp": "2026-01-13 17:00:00 IST"
}
```

**Error Responses**:

-   **401**: Unauthorized
-   **404**: Banner not found
-   **500**: Server error

---

### 6. HARD DELETE BANNER (PERMANENT)

**DELETE** `/api/banners/:id/force`

**Access**: Private (Admin)

**URL Parameters**:

```
id : String (MongoDB ObjectId)
```

**Description**:
Permanently removes banner from database and deletes all associated images from Cloudinary. This action cannot be undone.

**Example Request**:

```
DELETE /api/banners/677e1234567890abcdef1234/force
```

**Success Response (200)**:

```json
{
    "success": true,
    "statusCode": 200,
    "message": "Banner permanently deleted successfully",
    "timestamp": "2026-01-13 17:00:00 IST"
}
```

**Error Responses**:

-   **401**: Unauthorized
-   **404**: Banner not found
-   **500**: Server error

---

### 7. UPDATE BANNER STATUS

**PATCH** `/api/banners/:id/status`

**Access**: Private (Admin)

**Content-Type**: `application/json`

**URL Parameters**:

```
id : String (MongoDB ObjectId)
```

**Request Body**:

```json
{
    "isActive": true
}
```

**Description**:
Toggle banner active/inactive status. Use this to activate a soft-deleted banner or temporarily hide a banner.

**Example Request**:

```
PATCH /api/banners/677e1234567890abcdef1234/status
Content-Type: application/json

{
  "isActive": false
}
```

**Success Response (200)**:

```json
{
    "success": true,
    "statusCode": 200,
    "message": "Banner status updated successfully",
    "data": {
        "_id": "677e1234567890abcdef1234",
        "title": "Summer Sale 2026",
        "isActive": false,
        // ... other fields
        "updatedAt": "2026-01-13T11:45:00.000Z"
    },
    "timestamp": "2026-01-13 17:15:00 IST"
}
```

**Error Responses**:

-   **400**: isActive must be a boolean
-   **401**: Unauthorized
-   **404**: Banner not found
-   **500**: Server error

---

### 8. REORDER BANNERS (BULK UPDATE)

**POST** `/api/banners/reorder`

**Access**: Private (Admin)

**Content-Type**: `application/json`

**Request Body**:

```json
{
    "orders": [
        { "id": "677e1234567890abcdef1234", "sortOrder": 0 },
        { "id": "677e1234567890abcdef5678", "sortOrder": 1 },
        { "id": "677e1234567890abcdef9012", "sortOrder": 2 }
    ]
}
```

**Description**:
Bulk update sortOrder for multiple banners. Lower sortOrder appears first.

**Example Request**:

```
POST /api/banners/reorder
Content-Type: application/json

{
  "orders": [
    { "id": "677e1234567890abcdef1234", "sortOrder": 2 },
    { "id": "677e1234567890abcdef5678", "sortOrder": 0 },
    { "id": "677e1234567890abcdef9012", "sortOrder": 1 }
  ]
}
```

**Success Response (200)**:

```json
{
    "success": true,
    "statusCode": 200,
    "message": "Banners reordered successfully",
    "timestamp": "2026-01-13 17:30:00 IST"
}
```

**Error Responses**:

-   **400**: Orders array is required / Each order must have id and sortOrder
-   **401**: Unauthorized
-   **500**: Server error

---

## VALIDATION RULES

### Field Constraints:

-   **title**: Required, max 100 characters
-   **subtitle**: Optional, max 200 characters
-   **buttonText**: Optional, max 50 characters
-   **displayLocation**: Must be one of: "home", "shop", "about", "contact", "all"
-   **link.type**: Must be "internal" or "external"
-   **sortOrder**: Must be a valid number
-   **startDate**: Must be valid ISO date string
-   **endDate**: Must be valid ISO date string, must be after startDate
-   **desktopImage**: Required on create
-   **mobileImage**: Optional

### Date Validation:

-   If both startDate and endDate are provided, endDate must be after startDate
-   Dates should be in ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`

---

## IMAGE HANDLING

### Upload Guidelines:

-   **Desktop Image**: Required on create
-   **Mobile Image**: Optional
-   **Format**: Use FormData with field name "images"
-   **Order**: First file = desktop, Second file = mobile
-   **Supported Formats**: JPEG, PNG, WebP
-   **Max File Size**: Determined by server configuration

### Image Processing:

-   Automatically uploaded to Cloudinary
-   Multiple variants generated (thumbnail, small, medium, large, original)
-   Unique publicIds with timestamps to prevent collisions
-   Format: `banner_[timestamp]_desktop` or `banner_[timestamp]_mobile`

### Image Update:

-   Upload new images to replace existing ones
-   Old images automatically deleted after successful upload
-   Cannot delete images without uploading replacements
-   Upload-then-delete pattern ensures data integrity

### Image Deletion:

-   Soft delete: Images remain on Cloudinary
-   Hard delete: Images permanently removed from Cloudinary

---

## FILTERING & QUERYING

### Filter by Active Status:

```
GET /api/banners?isActive=true
```

Returns only active banners.

### Filter by Display Location:

```
GET /api/banners?displayLocation=home
```

Returns banners for specific page.

### Filter by Schedule:

```
GET /api/banners?scheduled=true
```

Returns banners that are currently scheduled (within startDate and endDate range, or no dates set).

### Combine Filters:

```
GET /api/banners?isActive=true&displayLocation=home&scheduled=true
```

Returns active, scheduled banners for the home page.

---

## SORTING

Banners are automatically sorted by:

1. `sortOrder` (ascending) - Lower numbers appear first
2. `createdAt` (descending) - Newer banners appear first when sortOrder is equal

Use the reorder endpoint to change banner order.

---

## SCHEDULED BANNERS

### Schedule Logic:

-   **No dates**: Banner is always scheduled
-   **Only startDate**: Banner is scheduled from startDate onwards
-   **Only endDate**: Banner is scheduled until endDate
-   **Both dates**: Banner is scheduled within the date range

### Virtual Property:

-   `isScheduled`: Computed property indicating if banner is within schedule

### Virtual Method:

-   `shouldDisplay()`: Returns true if banner is both active and scheduled

### Filter Scheduled:

```
GET /api/banners?scheduled=true
```

Returns banners currently within their scheduled time range.

---

## POSTMAN TESTING GUIDE

### SETUP POSTMAN ENVIRONMENT (Optional but Recommended)

1. Create a new environment in Postman
2. Add variable: `baseUrl` = `http://localhost:5000`
3. Add variable: `bannerId` = (will be filled after creating a banner)

---

### 1. CREATE BANNER (With Both Images)

**Method**: `POST`  
**URL**: `http://localhost:5000/api/banners`

**Headers**: (Auto-set by Postman when using form-data)

-   No need to manually set Content-Type

**Body Type**: Select `form-data`

**Add the following fields**:

| Key             | Value                                         | Type |
| --------------- | --------------------------------------------- | ---- |
| title           | Summer Sale 2026                              | Text |
| subtitle        | Get 50% off on all items                      | Text |
| link            | {"type":"internal","url":"/shop/sale"}        | Text |
| buttonText      | Shop Now                                      | Text |
| displayLocation | home                                          | Text |
| sortOrder       | 0                                             | Text |
| isActive        | true                                          | Text |
| startDate       | 2026-06-01T00:00:00Z                          | Text |
| endDate         | 2026-08-31T23:59:59Z                          | Text |
| images          | [Click "Select Files" → Choose desktop image] | File |
| images          | [Click "Select Files" → Choose mobile image]  | File |

**Important Notes**:

-   For `link` field: Type the JSON string exactly as shown (with quotes)
-   For `images`: Click the dropdown next to "Key" and select "File" type
-   Add TWO `images` fields (one for desktop, one for mobile)
-   First image = desktop, second image = mobile

**Expected Response**: Status 201 with banner object containing `_id` (save this ID for later tests)

---

### 2. CREATE BANNER (Desktop Image Only)

**Method**: `POST`  
**URL**: `http://localhost:5000/api/banners`

**Body Type**: `form-data`

| Key             | Value                       | Type |
| --------------- | --------------------------- | ---- |
| title           | New Arrivals                | Text |
| displayLocation | shop                        | Text |
| images          | [Select desktop image file] | File |

**Expected Response**: Status 201 with banner (no mobileImage in response)

---

### 3. GET ALL BANNERS

**Method**: `GET`  
**URL**: `http://localhost:5000/api/banners`

**No Body Required**

**Expected Response**: Status 200 with array of all banners

---

### 4. GET BANNERS WITH FILTERS

**Method**: `GET`  
**URL Examples**:

-   Active only: `http://localhost:5000/api/banners?isActive=true`
-   By location: `http://localhost:5000/api/banners?displayLocation=home`
-   Scheduled only: `http://localhost:5000/api/banners?scheduled=true`
-   Combined: `http://localhost:5000/api/banners?isActive=true&displayLocation=home&scheduled=true`

**Expected Response**: Status 200 with filtered banners array

---

### 5. GET BANNER BY ID

**Method**: `GET`  
**URL**: `http://localhost:5000/api/banners/{bannerId}`

Replace `{bannerId}` with actual ID from create response.

Example: `http://localhost:5000/api/banners/677e1234567890abcdef1234`

**Expected Response**: Status 200 with single banner object

---

### 6. UPDATE BANNER (Text Fields Only)

**Method**: `PUT`  
**URL**: `http://localhost:5000/api/banners/{bannerId}`

**Body Type**: `form-data`

| Key        | Value                     | Type |
| ---------- | ------------------------- | ---- |
| title      | Updated Summer Sale Title | Text |
| subtitle   | New subtitle here         | Text |
| buttonText | Learn More                | Text |
| isActive   | false                     | Text |

**Expected Response**: Status 200 with updated banner

---

### 7. UPDATE BANNER (Change Desktop Image)

**Method**: `PUT`  
**URL**: `http://localhost:5000/api/banners/{bannerId}`

**Body Type**: `form-data`

| Key    | Value                      | Type |
| ------ | -------------------------- | ---- |
| images | [Select new desktop image] | File |

**Expected Response**: Status 200 with updated banner (old desktop image replaced)

---

### 8. UPDATE BANNER (Change Both Images)

**Method**: `PUT`  
**URL**: `http://localhost:5000/api/banners/{bannerId}`

**Body Type**: `form-data`

| Key    | Value                      | Type |
| ------ | -------------------------- | ---- |
| images | [Select new desktop image] | File |
| images | [Select new mobile image]  | File |

**Expected Response**: Status 200 with updated banner (both images replaced)

---

### 9. UPDATE BANNER (Text + Images Together)

**Method**: `PUT`  
**URL**: `http://localhost:5000/api/banners/{bannerId}`

**Body Type**: `form-data`

| Key             | Value                      | Type |
| --------------- | -------------------------- | ---- |
| title           | Completely New Title       | Text |
| subtitle        | Completely New Subtitle    | Text |
| displayLocation | all                        | Text |
| images          | [Select new desktop image] | File |
| images          | [Select new mobile image]  | File |

**Expected Response**: Status 200 with fully updated banner

---

### 10. SOFT DELETE BANNER (Deactivate)

**Method**: `DELETE`  
**URL**: `http://localhost:5000/api/banners/{bannerId}`

**No Body Required**

**Expected Response**: Status 200 with deactivated banner (isActive: false)

---

### 11. UPDATE BANNER STATUS (Reactivate)

**Method**: `PATCH`  
**URL**: `http://localhost:5000/api/banners/{bannerId}/status`

**Body Type**: Select `raw` → `JSON`

**Body**:

```json
{
    "isActive": true
}
```

**Expected Response**: Status 200 with banner (isActive: true)

---

### 12. REORDER BANNERS

**Method**: `POST`  
**URL**: `http://localhost:5000/api/banners/reorder`

**Body Type**: Select `raw` → `JSON`

**Body**:

```json
{
    "orders": [
        { "id": "677e1234567890abcdef1234", "sortOrder": 0 },
        { "id": "677e1234567890abcdef5678", "sortOrder": 1 },
        { "id": "677e1234567890abcdef9012", "sortOrder": 2 }
    ]
}
```

Replace IDs with actual banner IDs from your database.

**Expected Response**: Status 200 with success message

---

### 13. HARD DELETE BANNER (Permanent)

**Method**: `DELETE`  
**URL**: `http://localhost:5000/api/banners/{bannerId}/force`

**No Body Required**

**Expected Response**: Status 200 with success message (banner removed from DB, images deleted from Cloudinary)

---

## POSTMAN TIPS & TRICKS

### Authentication

If authentication is enabled, you need to include the JWT cookie:

1. First, login via `/api/auth/login`
2. Postman will automatically store the cookie
3. All subsequent requests will include it

### Testing Workflow

**Recommended Testing Order**:

1. Create banner with both images → Save the `_id`
2. Get all banners → Verify it appears
3. Get banner by ID → Verify details
4. Update banner text → Check changes
5. Update banner images → Verify old images replaced
6. Soft delete → Check isActive becomes false
7. Update status → Reactivate banner
8. Create 2-3 more banners
9. Reorder banners → Change sortOrder
10. Hard delete → Permanently remove

### Common Postman Mistakes

**❌ Wrong**: Setting Content-Type header manually for form-data
**✅ Right**: Let Postman auto-set it when you select form-data

**❌ Wrong**: Typing image filename as text
**✅ Right**: Change dropdown from "Text" to "File" and select file

**❌ Wrong**: Sending link as plain text: `internal`
**✅ Right**: Send as JSON string: `{"type":"internal","url":"/shop/sale"}`

**❌ Wrong**: Adding only one `images` field for two files
**✅ Right**: Add two separate `images` fields (both as File type)

**❌ Wrong**: Using form-data for PATCH/reorder (JSON endpoints)
**✅ Right**: Use raw → JSON for status and reorder endpoints

### Debugging Failed Requests

**400 Bad Request**: Check validation errors in response

-   Missing required field (title, desktop image)
-   Invalid enum value (displayLocation, link.type)
-   Date range error (endDate before startDate)

**401 Unauthorized**: Login first and ensure cookie is sent

**404 Not Found**: Check banner ID is correct

**422 Validation Error**: Response includes detailed field errors

**500 Server Error**: Check server logs for details

### Sample Test Data

**Title Ideas**:

-   "Summer Sale 2026"
-   "New Collection Launch"
-   "Holiday Special Offer"
-   "Flash Sale - Limited Time"

**Display Locations**:

-   home
-   shop
-   about
-   contact
-   all

**Link Examples**:

-   Internal: `{"type":"internal","url":"/shop/sale"}`
-   External: `{"type":"external","url":"https://example.com"}`
-   No link: Don't include the field

**Date Examples**:

-   Start: `2026-06-01T00:00:00Z`
-   End: `2026-08-31T23:59:59Z`
-   No dates: Don't include the fields

---

## COMMON USE CASES

### 1. Display Active Home Page Banners:

```javascript
GET /api/banners?isActive=true&displayLocation=home&scheduled=true
```

Use this on the homepage to show only active, scheduled banners for that location.

### 2. Admin Dashboard - All Banners:

```javascript
GET / api / banners;
```

Shows all banners regardless of status for management.

### 3. Create Seasonal Banner:

```javascript
POST /api/banners
{
  title: "Holiday Sale",
  startDate: "2026-12-01T00:00:00Z",
  endDate: "2026-12-31T23:59:59Z",
  displayLocation: "all",
  // ... other fields
}
```

### 4. Temporarily Hide Banner:

```javascript
PATCH /api/banners/:id/status
{
  "isActive": false
}
```

### 5. Permanently Remove Old Banner:

```javascript
DELETE /api/banners/:id/force
```

---

## ERROR HANDLING

All endpoints return standardized error responses:

```json
{
    "success": false,
    "statusCode": 400,
    "message": "Error description",
    "data": {
        // Error details (for validation errors)
    },
    "timestamp": "2026-01-13 17:00:00 IST"
}
```

### Common Error Codes:

-   **400**: Bad Request (validation, missing required fields)
-   **401**: Unauthorized (no auth token)
-   **404**: Not Found (banner doesn't exist)
-   **422**: Validation Error (with detailed field errors)
-   **500**: Internal Server Error

---

## BEST PRACTICES

1. **Image Optimization**: Compress images before upload to reduce file size
2. **Scheduling**: Use startDate/endDate for time-sensitive campaigns
3. **Soft Delete First**: Use soft delete instead of hard delete to preserve data
4. **Sort Order**: Use increments of 10 (0, 10, 20) to make reordering easier
5. **Mobile Images**: Always provide mobile images for better mobile experience (though optional)
6. **Testing**: Test scheduled banners by adjusting server time or using different date ranges
7. **Display Logic**: Use `scheduled=true&isActive=true` filters on frontend
8. **Link Types**: Use "internal" for site navigation, "external" for external URLs

---

## NOTES

-   All timestamps are returned in IST (Indian Standard Time)
-   Image URLs are Cloudinary CDN links with multiple size variants
-   Banner IDs are MongoDB ObjectIds (24-character hex strings)
-   Authentication uses JWT tokens stored in httpOnly cookies
-   All protected routes require valid authentication
-   FormData must stringify objects (like `link`) before sending
