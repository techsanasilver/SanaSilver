# Cart System - Implementation Summary

## ✅ Complete Implementation Status

All cart files have been successfully created and the server is running on port 5001.

---

## Architecture Overview

### Storage Strategy

- **Guest Users**: LocalStorage (frontend manages cart)
- **Logged-in Users**: MongoDB (backend manages cart)
- **Merge on Login**: Guest cart merges with user cart

### Data Flow

```
Guest → Add to cart → Store in localStorage → Display with real-time prices
User logs in → Send localStorage cart → Backend merges → Clear localStorage
Logged-in → Add to cart → Save to DB → Fetch from DB
```

---

## Files Created

### 1. cart.model.js

```javascript
Cart {
  userId: ObjectId (unique),
  items: [{
    productId: ObjectId,
    variantId: ObjectId,
    quantity: Number (min: 1),
    addedAt: Date
  }],
  lastActivityAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Features:**

- Unique cart per user
- Auto-update lastActivityAt on save
- Indexed for fast queries
- No price snapshot (dynamic pricing)

---

### 2. cart.service.js

**Functions:**

- `getOrCreateCart(userId)` - Get existing or create new cart
- `getCartWithDetails(userId)` - Get cart with populated product/variant data
- `validateGuestCartItems(items)` - Validate guest cart items (for POST /cart)
- `addItemToCart(userId, productId, variantId, quantity)` - Add item with stock validation
- `updateCartItemQuantity(userId, productId, variantId, quantity)` - Update quantity
- `removeCartItem(userId, productId, variantId)` - Remove specific item
- `clearCart(userId)` - Clear all items
- `mergeGuestCart(userId, guestItems)` - Merge guest cart on login
- `getCartItemCount(userId)` - Get total item count

**Stock Validation:**

- Checks product/variant existence and active status
- Validates stock availability before adding
- Auto-adjusts quantities if stock changed
- Removes out-of-stock items automatically

**Merge Logic:**

- If item exists in both carts: Keep guest quantity (latest action)
- If item only in guest cart: Add to user cart
- If item only in user cart: Keep as is
- Validates stock for all items after merge

---

### 3. cart.controller.js

**Endpoints:**

#### POST /api/cart (optionalAuth)

Get cart with current prices

- **Logged-in**: Fetch from DB with populated details
- **Guest**: Validate items from request body

#### POST /api/cart/add (optionalAuth)

Add item to cart

- **Logged-in**: Save to DB with stock validation
- **Guest**: Return validated item (frontend stores in localStorage)

#### PUT /api/cart/update (authMiddleware)

Update item quantity (logged-in only)

- Validates new quantity
- Checks stock availability
- Returns updated cart

#### DELETE /api/cart/remove (authMiddleware)

Remove item from cart (logged-in only)

- Removes specific product+variant
- Returns updated cart

#### DELETE /api/cart/clear (authMiddleware)

Clear entire cart (logged-in only)

- Removes all items
- Returns empty cart

#### POST /api/cart/merge (authMiddleware)

Merge guest cart on login

- Accepts guest cart items from request body
- Merges with existing user cart
- Returns merged cart with current prices

#### GET /api/cart/count (authMiddleware)

Get cart item count (logged-in only)

- Returns total quantity of all items
- Useful for cart badge on header

---

### 4. cart.routes.js

**Routes:**

- `POST /api/cart` - Get cart (public)
- `POST /api/cart/add` - Add item (public)
- `PUT /api/cart/update` - Update quantity (private)
- `DELETE /api/cart/remove` - Remove item (private)
- `DELETE /api/cart/clear` - Clear cart (private)
- `POST /api/cart/merge` - Merge guest cart (private)
- `GET /api/cart/count` - Get item count (private)

**Middleware:**

- `optionalAuth` - Works for both guest and logged-in users
- `authMiddleware` - Requires authentication

---

## Key Features

### 1. Stock Validation ✅

- **On Add**: Checks if stock >= requested quantity
- **On Update**: Validates new quantity against stock
- **On Get**: Auto-adjusts if stock changed since last check
- **On Checkout**: Final validation before order creation

### 2. Dynamic Pricing ✅

- No price snapshot stored in cart
- Always fetches current price from product/variant
- Shows real-time pricing (important for silver jewelry)
- Prices update automatically when user views cart

### 3. Guest Cart Support ✅

- Guest cart stored in localStorage (frontend)
- Backend validates guest items on demand
- Can add items without authentication
- Merges seamlessly on login

### 4. Merge on Login ✅

- Intelligent merge algorithm
- Keeps guest cart quantity for conflicts
- Validates all items after merge
- Auto-adjusts for stock availability
- Returns merged cart with current prices

### 5. Auto-Cleanup ✅

- Removes inactive products automatically
- Removes inactive variants automatically
- Adjusts quantities if stock insufficient
- Cleans up on every cart fetch

---

## Frontend Integration Guide

### Guest Cart (LocalStorage)

```javascript
// Add to cart (guest)
const addToGuestCart = async (productId, variantId, quantity) => {
    // Call backend to validate
    const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, variantId, quantity }),
    });

    const { data } = await response.json();

    // Store in localStorage
    const cart = JSON.parse(localStorage.getItem("cart") || '{"items":[]}');
    const existingItem = cart.items.find(
        (item) => item.productId === productId && item.variantId === variantId,
    );

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.items.push({ productId, variantId, quantity });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
};

// Get cart with prices (guest)
const getGuestCart = async () => {
    const cart = JSON.parse(localStorage.getItem("cart") || '{"items":[]}');

    // Validate and get current prices
    const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart.items }),
    });

    return await response.json();
};
```

### Logged-in Cart (Database)

```javascript
// Add to cart (logged-in)
const addToCart = async (productId, variantId, quantity) => {
    const response = await fetch("/api/cart/add", {
        method: "POST",
        credentials: "include", // Send cookies
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, variantId, quantity }),
    });

    return await response.json();
};

// Get cart (logged-in)
const getCart = async () => {
    const response = await fetch("/api/cart", {
        method: "POST",
        credentials: "include",
    });

    return await response.json();
};

// Update quantity
const updateCartItem = async (productId, variantId, quantity) => {
    const response = await fetch("/api/cart/update", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, variantId, quantity }),
    });

    return await response.json();
};

// Remove item
const removeFromCart = async (productId, variantId) => {
    const response = await fetch("/api/cart/remove", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, variantId }),
    });

    return await response.json();
};
```

### Merge on Login

```javascript
// After successful login
const mergeCart = async () => {
    const guestCart = JSON.parse(
        localStorage.getItem("cart") || '{"items":[]}',
    );

    if (guestCart.items.length > 0) {
        const response = await fetch("/api/cart/merge", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: guestCart.items }),
        });

        // Clear guest cart after merge
        localStorage.removeItem("cart");

        return await response.json();
    }
};
```

---

## Response Format

### Success Response

```json
{
    "success": true,
    "message": "Cart retrieved successfully",
    "data": {
        "userId": "userId123",
        "items": [
            {
                "productId": {
                    "_id": "prod123",
                    "name": "Silver Chain",
                    "slug": "silver-chain",
                    "images": ["url1", "url2"],
                    "isActive": true
                },
                "variantId": {
                    "_id": "var123",
                    "attributes": { "length": "18 inch" },
                    "price": 2999,
                    "stockQuantity": 10,
                    "isActive": true,
                    "images": ["url1"]
                },
                "quantity": 2,
                "addedAt": "2026-02-04T12:00:00.000Z"
            }
        ],
        "lastActivityAt": "2026-02-04T12:30:00.000Z"
    }
}
```

### Error Response

```json
{
    "success": false,
    "message": "Insufficient stock. Only 5 items available"
}
```

### Validation Notifications

When fetching cart, if items were auto-adjusted:

```json
{
  "success": true,
  "message": "Cart retrieved successfully",
  "data": { ... },
  "notifications": {
    "stockUpdates": [
      {
        "name": "Silver Ring",
        "oldQty": 3,
        "newQty": 2
      }
    ],
    "removedItems": ["Product XYZ"]
  }
}
```

---

## Server Status

✅ **Server running on port 5001**
✅ **MongoDB connected**
✅ **All cart routes active**
✅ **No errors**

---

## Postman Testing Guide

### Setup Prerequisites

1. **Base URL**: `http://localhost:5001`
2. **Authentication**: JWT stored in cookies
3. **Get Auth Token**: Login first to get cookies for authenticated endpoints

---

### Test Flow Overview

```
1. Test as Guest (no auth)
   ├─ Add to cart (validate item)
   └─ Get cart (validate localStorage items)

2. Login & Get Tokens
   └─ POST /api/auth/login

3. Test as Logged-in User
   ├─ Add to cart (saves to DB)
   ├─ Get cart (from DB)
   ├─ Update quantity
   ├─ Get cart count
   ├─ Remove item
   ├─ Clear cart
   └─ Merge guest cart
```

---

### 1️⃣ Guest User Tests

#### **Test 1.1: Add to Cart (Guest)**

Validates item but doesn't save to DB.

**Request:**

```http
POST http://localhost:5001/api/cart/add
Content-Type: application/json

{
  "productId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "variantId": "65a1b2c3d4e5f6g7h8i9j0k2",
  "quantity": 2
}
```

**Expected Response (200 OK):**

```json
{
    "success": true,
    "message": "Item validated successfully",
    "data": {
        "productId": "65a1b2c3d4e5f6g7h8i9j0k1",
        "variantId": "65a1b2c3d4e5f6g7h8i9j0k2",
        "quantity": 2,
        "product": {
            "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
            "name": "Silver Chain",
            "slug": "silver-chain",
            "images": ["https://example.com/image.jpg"],
            "isActive": true
        },
        "variant": {
            "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
            "attributes": { "length": "18 inch" },
            "price": 2999,
            "stockQuantity": 10,
            "isActive": true,
            "images": ["https://example.com/variant-image.jpg"]
        }
    }
}
```

**Test Scenarios:**

- ✅ Valid product/variant with stock
- ❌ Invalid productId: `"Product not found"`
- ❌ Invalid variantId: `"Variant not found"`
- ❌ Quantity > stock: Adjusted quantity returned
- ❌ Inactive product: `"Product unavailable"`
- ❌ Missing productId/variantId: `"Product ID and Variant ID are required"`
- ❌ Quantity < 1: `"Quantity must be at least 1"`

---

#### **Test 1.2: Get Cart (Guest)**

Validates items from localStorage.

**Request:**

```http
POST http://localhost:5001/api/cart
Content-Type: application/json

{
  "items": [
    {
      "productId": "65a1b2c3d4e5f6g7h8i9j0k1",
      "variantId": "65a1b2c3d4e5f6g7h8i9j0k2",
      "quantity": 2
    },
    {
      "productId": "65a1b2c3d4e5f6g7h8i9j0k3",
      "variantId": "65a1b2c3d4e5f6g7h8i9j0k4",
      "quantity": 1
    }
  ]
}
```

**Expected Response (200 OK):**

```json
{
  "success": true,
  "message": "Cart validated successfully",
  "data": {
    "items": [
      {
        "productId": "65a1b2c3d4e5f6g7h8i9j0k1",
        "variantId": "65a1b2c3d4e5f6g7h8i9j0k2",
        "quantity": 2,
        "product": { ... },
        "variant": { ... }
      },
      {
        "productId": "65a1b2c3d4e5f6g7h8i9j0k3",
        "variantId": "65a1b2c3d4e5f6g7h8i9j0k4",
        "quantity": 1,
        "product": { ... },
        "variant": { ... }
      }
    ]
  }
}
```

**Test Scenarios:**

- ✅ Valid items: Returns all with current prices
- ✅ Empty items array: Returns empty array
- ⚠️ Some items invalid: Returns only valid items
- ⚠️ Quantity > stock: Auto-adjusts quantity
- ⚠️ Inactive items: Excluded from response

---

### 2️⃣ Authentication Setup

#### **Test 2.1: Login to Get Auth Cookies**

Required for all logged-in user tests.

**Request:**

```http
POST http://localhost:5001/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Expected Response (200 OK):**

```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "userId": "65a1b2c3d4e5f6g7h8i9j0k5",
            "name": "John Doe",
            "email": "user@example.com",
            "role": "customer"
        }
    }
}
```

**Important:**

- Cookies (`accessToken`, `refreshToken`) are automatically set
- Use these cookies for all subsequent authenticated requests
- In Postman: Enable "Automatically follow redirects" and "Save cookies"

---

### 3️⃣ Logged-in User Tests

#### **Test 3.1: Add to Cart (Logged-in)**

Saves item to database.

**Request:**

```http
POST http://localhost:5001/api/cart/add
Content-Type: application/json
Cookie: accessToken=<token>; refreshToken=<token>

{
  "productId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "variantId": "65a1b2c3d4e5f6g7h8i9j0k2",
  "quantity": 2
}
```

**Expected Response (200 OK):**

```json
{
    "success": true,
    "message": "Item added to cart successfully",
    "data": {
        "userId": "65a1b2c3d4e5f6g7h8i9j0k5",
        "items": [
            {
                "productId": "65a1b2c3d4e5f6g7h8i9j0k1",
                "variantId": "65a1b2c3d4e5f6g7h8i9j0k2",
                "quantity": 2,
                "addedAt": "2026-02-05T10:30:00.000Z",
                "_id": "65a1b2c3d4e5f6g7h8i9j0k6"
            }
        ],
        "lastActivityAt": "2026-02-05T10:30:00.000Z",
        "_id": "65a1b2c3d4e5f6g7h8i9j0k7",
        "createdAt": "2026-02-05T10:30:00.000Z",
        "updatedAt": "2026-02-05T10:30:00.000Z"
    }
}
```

**Test Scenarios:**

- ✅ New item: Added to cart
- ✅ Existing item: Quantity incremented
- ❌ Insufficient stock: `"Insufficient stock"`
- ❌ Invalid auth: `401 Unauthorized`

---

#### **Test 3.2: Get Cart (Logged-in)**

Fetches cart from database with populated details.

**Request:**

```http
POST http://localhost:5001/api/cart
Cookie: accessToken=<token>; refreshToken=<token>
```

**Expected Response (200 OK):**

```json
{
    "success": true,
    "message": "Cart retrieved successfully",
    "data": {
        "userId": "65a1b2c3d4e5f6g7h8i9j0k5",
        "items": [
            {
                "productId": {
                    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
                    "name": "Silver Chain",
                    "slug": "silver-chain",
                    "images": ["https://example.com/image.jpg"],
                    "isActive": true
                },
                "variantId": {
                    "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
                    "attributes": { "length": "18 inch" },
                    "price": 2999,
                    "stockQuantity": 10,
                    "isActive": true,
                    "images": ["https://example.com/variant-image.jpg"]
                },
                "quantity": 2,
                "addedAt": "2026-02-05T10:30:00.000Z",
                "_id": "65a1b2c3d4e5f6g7h8i9j0k6"
            }
        ],
        "lastActivityAt": "2026-02-05T10:30:00.000Z",
        "_id": "65a1b2c3d4e5f6g7h8i9j0k7"
    }
}
```

**Test Scenarios:**

- ✅ Cart exists: Returns with populated data
- ✅ Empty cart: Returns empty items array
- ⚠️ Some items invalid: Auto-removed, returns valid items only
- ⚠️ Stock changed: Quantities auto-adjusted

---

#### **Test 3.3: Update Cart Item Quantity**

Updates quantity of existing item.

**Request:**

```http
PUT http://localhost:5001/api/cart/update
Content-Type: application/json
Cookie: accessToken=<token>; refreshToken=<token>

{
  "productId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "variantId": "65a1b2c3d4e5f6g7h8i9j0k2",
  "quantity": 5
}
```

**Expected Response (200 OK):**

```json
{
    "success": true,
    "message": "Cart updated successfully",
    "data": {
        "userId": "65a1b2c3d4e5f6g7h8i9j0k5",
        "items": [
            {
                "productId": "65a1b2c3d4e5f6g7h8i9j0k1",
                "variantId": "65a1b2c3d4e5f6g7h8i9j0k2",
                "quantity": 5,
                "addedAt": "2026-02-05T10:30:00.000Z"
            }
        ],
        "lastActivityAt": "2026-02-05T10:35:00.000Z"
    }
}
```

**Test Scenarios:**

- ✅ Valid quantity: Updated successfully
- ❌ Quantity > stock: `"Insufficient stock. Only X items available"`
- ❌ Quantity < 1: `"Quantity must be at least 1"`
- ❌ Item not in cart: `"Item not found in cart"`
- ❌ Missing fields: `"Product ID, Variant ID, and Quantity are required"`

---

#### **Test 3.4: Get Cart Item Count**

Returns total quantity for cart badge.

**Request:**

```http
GET http://localhost:5001/api/cart/count
Cookie: accessToken=<token>; refreshToken=<token>
```

**Expected Response (200 OK):**

```json
{
    "success": true,
    "message": "Cart count retrieved successfully",
    "data": {
        "count": 7
    }
}
```

**Note:** If cart has 2 items with quantities 2 and 5, count = 7

---

#### **Test 3.5: Remove Item from Cart**

Removes specific product+variant from cart.

**Request:**

```http
DELETE http://localhost:5001/api/cart/remove
Content-Type: application/json
Cookie: accessToken=<token>; refreshToken=<token>

{
  "productId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "variantId": "65a1b2c3d4e5f6g7h8i9j0k2"
}
```

**Expected Response (200 OK):**

```json
{
    "success": true,
    "message": "Item removed from cart successfully",
    "data": {
        "userId": "65a1b2c3d4e5f6g7h8i9j0k5",
        "items": [],
        "lastActivityAt": "2026-02-05T10:40:00.000Z"
    }
}
```

**Test Scenarios:**

- ✅ Item exists: Removed successfully
- ⚠️ Item not in cart: Still returns success (idempotent)
- ❌ Missing fields: `"Product ID and Variant ID are required"`

---

#### **Test 3.6: Clear Entire Cart**

Removes all items from cart.

**Request:**

```http
DELETE http://localhost:5001/api/cart/clear
Cookie: accessToken=<token>; refreshToken=<token>
```

**Expected Response (200 OK):**

```json
{
    "success": true,
    "message": "Cart cleared successfully",
    "data": {
        "userId": "65a1b2c3d4e5f6g7h8i9j0k5",
        "items": [],
        "lastActivityAt": "2026-02-05T10:45:00.000Z"
    }
}
```

**Use Case:** After successful checkout or when user wants to start fresh.

---

#### **Test 3.7: Merge Guest Cart on Login**

Merges localStorage cart with user's database cart.

**Request:**

```http
POST http://localhost:5001/api/cart/merge
Content-Type: application/json
Cookie: accessToken=<token>; refreshToken=<token>

{
  "items": [
    {
      "productId": "65a1b2c3d4e5f6g7h8i9j0k3",
      "variantId": "65a1b2c3d4e5f6g7h8i9j0k4",
      "quantity": 3
    },
    {
      "productId": "65a1b2c3d4e5f6g7h8i9j0k1",
      "variantId": "65a1b2c3d4e5f6g7h8i9j0k2",
      "quantity": 1
    }
  ]
}
```

**Expected Response (200 OK):**

```json
{
    "success": true,
    "message": "Cart merged successfully",
    "data": {
        "userId": "65a1b2c3d4e5f6g7h8i9j0k5",
        "items": [
            {
                "productId": {
                    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
                    "name": "Silver Chain"
                },
                "variantId": {
                    "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
                    "price": 2999,
                    "stockQuantity": 10
                },
                "quantity": 1,
                "addedAt": "2026-02-05T10:50:00.000Z"
            },
            {
                "productId": {
                    "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
                    "name": "Silver Ring"
                },
                "variantId": {
                    "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
                    "price": 1999,
                    "stockQuantity": 5
                },
                "quantity": 3,
                "addedAt": "2026-02-05T10:50:00.000Z"
            }
        ],
        "lastActivityAt": "2026-02-05T10:50:00.000Z"
    }
}
```

**Merge Logic:**

- If item in both carts: **Guest quantity wins** (user's latest action)
- If item only in guest cart: Added to user cart
- If item only in user cart: Kept as is
- All items validated for stock after merge

**Test Scenarios:**

- ✅ Empty guest cart: User cart unchanged
- ✅ Items in both: Guest quantity used
- ✅ New items: Added to user cart
- ⚠️ Invalid guest items: Skipped, valid items merged

---

### 4️⃣ Error Handling Tests

#### **Test 4.1: Unauthorized Access**

Try accessing protected endpoints without authentication.

**Request:**

```http
PUT http://localhost:5001/api/cart/update
Content-Type: application/json

{
  "productId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "variantId": "65a1b2c3d4e5f6g7h8i9j0k2",
  "quantity": 5
}
```

**Expected Response (401 Unauthorized):**

```json
{
    "success": false,
    "message": "Unauthorized"
}
```

---

#### **Test 4.2: Insufficient Stock**

Try adding more items than available stock.

**Request:**

```http
POST http://localhost:5001/api/cart/add
Content-Type: application/json
Cookie: accessToken=<token>; refreshToken=<token>

{
  "productId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "variantId": "65a1b2c3d4e5f6g7h8i9j0k2",
  "quantity": 999
}
```

**Expected Response (400 Bad Request):**

```json
{
    "success": false,
    "message": "Insufficient stock. Only 10 items available"
}
```

---

#### **Test 4.3: Invalid Product/Variant ID**

Try adding non-existent product.

**Request:**

```http
POST http://localhost:5001/api/cart/add
Content-Type: application/json

{
  "productId": "000000000000000000000000",
  "variantId": "000000000000000000000000",
  "quantity": 1
}
```

**Expected Response (400 Bad Request):**

```json
{
    "success": false,
    "message": "Product not available or out of stock"
}
```

---

#### **Test 4.4: Missing Required Fields**

Try adding item without required fields.

**Request:**

```http
POST http://localhost:5001/api/cart/add
Content-Type: application/json

{
  "quantity": 1
}
```

**Expected Response (400 Bad Request):**

```json
{
    "success": false,
    "message": "Product ID and Variant ID are required"
}
```

---

### 5️⃣ Postman Collection Setup

#### **Environment Variables**

Create a Postman environment with:

```
baseUrl = http://localhost:5001
accessToken = (auto-populated from login)
refreshToken = (auto-populated from login)
```

#### **Pre-request Script (for authenticated endpoints)**

```javascript
// Automatically attach cookies from environment
pm.request.headers.add({
    key: "Cookie",
    value: `accessToken=${pm.environment.get("accessToken")}; refreshToken=${pm.environment.get("refreshToken")}`,
});
```

#### **Test Script (for login endpoint)**

```javascript
// Save tokens to environment
if (pm.response.code === 200) {
    const cookies = pm.cookies.all();
    cookies.forEach((cookie) => {
        if (cookie.name === "accessToken") {
            pm.environment.set("accessToken", cookie.value);
        }
        if (cookie.name === "refreshToken") {
            pm.environment.set("refreshToken", cookie.value);
        }
    });
}
```

---

### 6️⃣ Testing Checklist

#### Guest User Flow:

- [ ] Add item to cart (validates successfully)
- [ ] Get cart with multiple items (returns current prices)
- [ ] Try adding out-of-stock item (returns error)
- [ ] Try adding inactive product (returns error)

#### Logged-in User Flow:

- [ ] Login successfully (cookies set)
- [ ] Add item to cart (saves to DB)
- [ ] Get cart (retrieves from DB with details)
- [ ] Update quantity (validates stock)
- [ ] Get cart count (returns correct total)
- [ ] Remove item (removes successfully)
- [ ] Clear cart (removes all items)

#### Merge Flow:

- [ ] Add items as guest
- [ ] Login (merge should be triggered)
- [ ] Merge cart API (guest items added/merged)
- [ ] Verify merged cart has all items

#### Error Cases:

- [ ] Try protected endpoint without auth (401)
- [ ] Try adding with quantity > stock (400)
- [ ] Try adding invalid product ID (400)
- [ ] Try updating with missing fields (400)

---

## Next Steps

1. ✅ **Test APIs**: Use Postman/Thunder Client with guide above
2. **Frontend Integration**: Implement localStorage logic for guest carts
3. **Add to existing pages**: Integrate cart buttons on product pages
4. **Cart page**: Create cart display page with quantity controls
5. **Checkout flow**: Link cart to checkout process
