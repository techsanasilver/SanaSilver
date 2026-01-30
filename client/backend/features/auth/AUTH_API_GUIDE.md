# Sana Silver Client - Phone OTP Authentication API Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Authentication Flow](#authentication-flow)
3. [API Endpoints](#api-endpoints)
4. [Postman Setup & Testing](#postman-setup--testing)
5. [Error Handling](#error-handling)
6. [Security Features](#security-features)

---

## System Overview

### Authentication Method
- **Type:** Phone Number + OTP (One-Time Password)
- **Phone Format:** Indian numbers (+91 prefix)
- **OTP Storage:** Hashed in database (bcrypt)
- **Token System:** JWT with Access Token (15 min) + Refresh Token (7 days)
- **Cookie-based:** Tokens stored in httpOnly cookies for security

### Key Features
- ✅ Auto-registration on first OTP login
- ✅ Hardcoded OTP for development: `111111`
- ✅ Test phone numbers with instant OTP acceptance
- ✅ Rate limiting: 3 OTP requests per 15 minutes
- ✅ Attempt limiting: 3 verification attempts per OTP
- ✅ OTP expiry: 5 minutes
- ✅ Auto-cleanup of expired OTPs
- ✅ User account activation/deactivation
- ✅ Last login tracking
- ✅ Token version management (logout all devices)

### Test Phone Numbers (Bypass Real OTP)
These numbers always accept OTP `111111`:
- `+919999999999`
- `+918888888888`
- `+917777777777`

### Base URL
```
http://localhost:5001/api/auth
```

---

## Authentication Flow

### 1. New User Registration + Login Flow
```
1. User enters phone number
   ↓
2. Frontend calls /send-otp
   ↓
3. Backend sends OTP (hardcoded: 111111)
   ↓
4. User enters OTP
   ↓
5. Frontend calls /verify-otp
   ↓
6. Backend verifies OTP & creates user (if new)
   ↓
7. Backend sets accessToken & refreshToken cookies
   ↓
8. Backend returns user data with isNewUser flag
   ↓
9. If isNewUser = true, redirect to profile completion
```

### 2. Existing User Login Flow
```
1. User enters phone number
   ↓
2. Frontend calls /send-otp
   ↓
3. Backend sends OTP
   ↓
4. User enters OTP
   ↓
5. Frontend calls /verify-otp
   ↓
6. Backend verifies OTP & finds existing user
   ↓
7. Backend sets tokens in cookies
   ↓
8. Backend returns user data with isNewUser = false
   ↓
9. Redirect to home/dashboard
```

### 3. Token Refresh Flow
```
1. Access token expires (15 min)
   ↓
2. Frontend receives 401 Unauthorized
   ↓
3. Frontend calls /refresh-token automatically
   ↓
4. Backend validates refresh token from cookie
   ↓
5. Backend generates new access token
   ↓
6. Backend sets new accessToken cookie
   ↓
7. Frontend retries original request
```

---

## API Endpoints

### 1. Send OTP

**Endpoint:** `POST /api/auth/send-otp`

**Description:** Sends OTP to the provided phone number. Creates OTP record in database.

**Authentication:** Not required (Public)

**Request Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```json
{
  "phone": "9876543210"
}
```

**Request Body Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Indian phone number (10 digits starting with 6-9) |

**Phone Number Formats Accepted:**
- `9876543210` (10 digits)
- `919876543210` (with country code)
- `+919876543210` (with + prefix)

**Success Response:** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "OTP sent successfully",
  "data": {
    "phone": "+919876543210",
    "otp": "111111"
  },
  "timestamp": "31-01-2026 12:30:45 IST"
}
```

**Note:** `otp` field only returned in development mode for testing.

**Error Responses:**

**400 Bad Request - Missing phone:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Phone number is required",
  "timestamp": "31-01-2026 12:30:45 IST"
}
```

**400 Bad Request - Invalid phone:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid Indian phone number",
  "timestamp": "31-01-2026 12:30:45 IST"
}
```

**400 Bad Request - Rate limit exceeded:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Too many OTP requests. Please try again after 15 minutes",
  "timestamp": "31-01-2026 12:30:45 IST"
}
```

**Postman Example:**
```javascript
// Request
POST http://localhost:5001/api/auth/send-otp
Content-Type: application/json

{
  "phone": "9876543210"
}

// Note: No cookies needed for this endpoint
```

---

### 2. Verify OTP & Login

**Endpoint:** `POST /api/auth/verify-otp`

**Description:** Verifies OTP and authenticates user. Creates new user if phone doesn't exist (auto-registration).

**Authentication:** Not required (Public)

**Request Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```json
{
  "phone": "9876543210",
  "otp": "111111"
}
```

**Request Body Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Same phone number used in send-otp |
| otp | string | Yes | 6-digit OTP received via SMS |

**Success Response:** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "65b8f7c9e9d4a2b3c4d5e6f7",
      "phone": "+919876543210",
      "firstName": null,
      "lastName": null,
      "email": null,
      "isNewUser": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "31-01-2026 12:35:20 IST"
}
```

**Success Response - Existing User:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "65b8f7c9e9d4a2b3c4d5e6f7",
      "phone": "+919876543210",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "isNewUser": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "31-01-2026 12:35:20 IST"
}
```

**Cookies Set:**
- `accessToken` (httpOnly, secure in production, 15 min expiry)
- `refreshToken` (httpOnly, secure in production, 7 days expiry)

**Error Responses:**

**400 Bad Request - Missing fields:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Phone number and OTP are required",
  "timestamp": "31-01-2026 12:35:20 IST"
}
```

**400 Bad Request - OTP not found:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "OTP not found or already used",
  "timestamp": "31-01-2026 12:35:20 IST"
}
```

**400 Bad Request - OTP expired:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "OTP has expired. Please request a new one",
  "timestamp": "31-01-2026 12:35:20 IST"
}
```

**400 Bad Request - Invalid OTP:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid OTP",
  "timestamp": "31-01-2026 12:35:20 IST"
}
```

**400 Bad Request - Max attempts exceeded:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Maximum OTP attempts exceeded. Please request a new OTP",
  "timestamp": "31-01-2026 12:35:20 IST"
}
```

**400 Bad Request - Account deactivated:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Your account has been deactivated. Please contact support",
  "timestamp": "31-01-2026 12:35:20 IST"
}
```

**Postman Example:**
```javascript
// Request
POST http://localhost:5001/api/auth/verify-otp
Content-Type: application/json

{
  "phone": "9876543210",
  "otp": "111111"
}

// Important: Enable "Automatically follow redirects" in Postman
// Enable "Save cookies" to persist authentication
```

---

### 3. Refresh Access Token

**Endpoint:** `POST /api/auth/refresh-token`

**Description:** Generates a new access token using the refresh token from cookies.

**Authentication:** Requires valid refresh token in cookie

**Request Headers:**
```http
Cookie: refreshToken=<refresh_token_value>
```

**Request Body:** Empty

**Success Response:** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "31-01-2026 12:50:10 IST"
}
```

**Cookies Updated:**
- `accessToken` (new token with fresh 15 min expiry)

**Error Responses:**

**401 Unauthorized - Missing refresh token:**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Refresh token required",
  "timestamp": "31-01-2026 12:50:10 IST"
}
```

**401 Unauthorized - Expired refresh token:**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Refresh token expired. Please login again",
  "timestamp": "31-01-2026 12:50:10 IST"
}
```

**401 Unauthorized - Invalid refresh token:**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid refresh token",
  "timestamp": "31-01-2026 12:50:10 IST"
}
```

**401 Unauthorized - Token invalidated:**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Token has been invalidated. Please login again",
  "timestamp": "31-01-2026 12:50:10 IST"
}
```

**403 Forbidden - Account deactivated:**
```json
{
  "success": false,
  "statusCode": 403,
  "message": "User account is deactivated",
  "timestamp": "31-01-2026 12:50:10 IST"
}
```

**Postman Example:**
```javascript
// Request
POST http://localhost:5001/api/auth/refresh-token

// No body needed
// Cookie header automatically included if cookies saved from login
```

---

### 4. Get User Profile

**Endpoint:** `GET /api/auth/profile`

**Description:** Retrieves authenticated user's profile information.

**Authentication:** Required (Access token in cookie)

**Request Headers:**
```http
Cookie: accessToken=<access_token_value>
```

**Request Body:** None

**Success Response:** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile fetched successfully",
  "data": {
    "user": {
      "_id": "65b8f7c9e9d4a2b3c4d5e6f7",
      "phone": "+919876543210",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "addresses": [
        {
          "_id": "65b8f7d1e9d4a2b3c4d5e6f8",
          "type": "home",
          "name": "John Doe",
          "phone": "+919876543210",
          "addressLine1": "123 Main Street",
          "addressLine2": "Apartment 4B",
          "city": "Mumbai",
          "state": "Maharashtra",
          "pincode": "400001",
          "landmark": "Near City Mall",
          "isDefault": true
        }
      ],
      "lastLoginAt": "2026-01-31T07:05:20.123Z",
      "createdAt": "2026-01-15T10:30:00.000Z"
    }
  },
  "timestamp": "31-01-2026 13:00:00 IST"
}
```

**Error Responses:**

**401 Unauthorized - No token:**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Access token required",
  "timestamp": "31-01-2026 13:00:00 IST"
}
```

**401 Unauthorized - Expired token:**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Token expired. Please refresh your token",
  "timestamp": "31-01-2026 13:00:00 IST"
}
```

**401 Unauthorized - Invalid token:**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid token",
  "timestamp": "31-01-2026 13:00:00 IST"
}
```

**404 Not Found - User not found:**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "User not found",
  "timestamp": "31-01-2026 13:00:00 IST"
}
```

**403 Forbidden - Account deactivated:**
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Your account has been deactivated. Please contact support",
  "timestamp": "31-01-2026 13:00:00 IST"
}
```

**Postman Example:**
```javascript
// Request
GET http://localhost:5001/api/auth/profile

// No body needed
// Access token cookie automatically included
```

---

### 5. Update User Profile

**Endpoint:** `PUT /api/auth/profile`

**Description:** Updates authenticated user's profile information.

**Authentication:** Required (Access token in cookie)

**Request Headers:**
```http
Content-Type: application/json
Cookie: accessToken=<access_token_value>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "addresses": [
    {
      "type": "home",
      "name": "John Doe",
      "phone": "+919876543210",
      "addressLine1": "123 Main Street",
      "addressLine2": "Apartment 4B",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "landmark": "Near City Mall",
      "isDefault": true
    }
  ]
}
```

**Request Body Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| firstName | string | No | User's first name (max 50 chars) |
| lastName | string | No | User's last name (max 50 chars) |
| email | string | No | User's email (must be valid email format) |
| addresses | array | No | Array of address objects |

**Address Object Structure:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | Yes | Address type: "home", "office", or "other" |
| name | string | Yes | Recipient name |
| phone | string | Yes | Recipient phone number |
| addressLine1 | string | Yes | Street address line 1 |
| addressLine2 | string | No | Street address line 2 |
| city | string | Yes | City name |
| state | string | Yes | State name |
| pincode | string | Yes | Postal code |
| landmark | string | No | Nearby landmark |
| isDefault | boolean | No | Set as default address (default: false) |

**Protected Fields (Cannot be updated via this endpoint):**
- `phone` - Cannot be changed
- `isActive` - Only admin can change
- `tokenVersion` - System managed

**Success Response:** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "_id": "65b8f7c9e9d4a2b3c4d5e6f7",
      "phone": "+919876543210",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "addresses": [
        {
          "_id": "65b8f7d1e9d4a2b3c4d5e6f8",
          "type": "home",
          "name": "John Doe",
          "phone": "+919876543210",
          "addressLine1": "123 Main Street",
          "addressLine2": "Apartment 4B",
          "city": "Mumbai",
          "state": "Maharashtra",
          "pincode": "400001",
          "landmark": "Near City Mall",
          "isDefault": true
        }
      ]
    }
  },
  "timestamp": "31-01-2026 13:15:30 IST"
}
```

**Error Responses:**

**401 Unauthorized - No token:**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Access token required",
  "timestamp": "31-01-2026 13:15:30 IST"
}
```

**404 Not Found - User not found:**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "User not found",
  "timestamp": "31-01-2026 13:15:30 IST"
}
```

**422 Unprocessable Entity - Validation error:**
```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed",
  "data": {
    "firstName": "First name cannot exceed 50 characters",
    "email": "Please provide a valid email address"
  },
  "timestamp": "31-01-2026 13:15:30 IST"
}
```

**Postman Example:**
```javascript
// Request
PUT http://localhost:5001/api/auth/profile
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com"
}

// Access token cookie automatically included
```

---

### 6. Logout

**Endpoint:** `POST /api/auth/logout`

**Description:** Logs out the user by clearing authentication cookies.

**Authentication:** Required (Access token in cookie)

**Request Headers:**
```http
Cookie: accessToken=<access_token_value>
```

**Request Body:** None

**Success Response:** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logged out successfully",
  "timestamp": "31-01-2026 14:00:00 IST"
}
```

**Cookies Cleared:**
- `accessToken`
- `refreshToken`

**Error Responses:**

**401 Unauthorized - No token:**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Access token required",
  "timestamp": "31-01-2026 14:00:00 IST"
}
```

**Postman Example:**
```javascript
// Request
POST http://localhost:5001/api/auth/logout

// No body needed
// Access token cookie automatically included
// Cookies will be cleared after successful logout
```

---

## Postman Setup & Testing

### Step 1: Import Collection

Create a new Postman collection named "Sana Silver Client Auth" with the following settings:

**Collection Variables:**
- `baseUrl`: `http://localhost:5001`
- `phone`: `9876543210` (for testing)
- `testPhone1`: `9999999999` (test number)
- `testPhone2`: `8888888888` (test number)
- `otp`: `111111` (hardcoded OTP)

### Step 2: Configure Collection Settings

1. **Authorization:** Type = "No Auth" (we use cookies)
2. **Pre-request Script:** (Optional - Auto-refresh logic)
```javascript
// Auto-refresh token if expired (optional)
pm.sendRequest({
    url: pm.variables.get('baseUrl') + '/api/auth/refresh-token',
    method: 'POST'
}, function (err, response) {
    if (!err && response.code === 200) {
        console.log('Token refreshed automatically');
    }
});
```

### Step 3: Create Requests

#### Request 1: Send OTP
```
Method: POST
URL: {{baseUrl}}/api/auth/send-otp
Headers: 
  Content-Type: application/json
Body (raw JSON):
{
  "phone": "{{phone}}"
}

Tests Script:
pm.test("Status is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("OTP sent successfully", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.data.phone).to.exist;
});

// Save phone for next request
var jsonData = pm.response.json();
pm.collectionVariables.set("normalizedPhone", jsonData.data.phone);
```

#### Request 2: Verify OTP & Login
```
Method: POST
URL: {{baseUrl}}/api/auth/verify-otp
Headers: 
  Content-Type: application/json
Body (raw JSON):
{
  "phone": "{{phone}}",
  "otp": "{{otp}}"
}

Tests Script:
pm.test("Login successful", function () {
    pm.response.to.have.status(200);
});

pm.test("Access token received", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.accessToken).to.exist;
});

pm.test("User data received", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.user._id).to.exist;
    pm.expect(jsonData.data.user.phone).to.exist;
});

// Cookies are automatically saved by Postman
```

#### Request 3: Get Profile
```
Method: GET
URL: {{baseUrl}}/api/auth/profile

Tests Script:
pm.test("Profile fetched", function () {
    pm.response.to.have.status(200);
});

pm.test("User profile data present", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.user.phone).to.exist;
});
```

#### Request 4: Update Profile
```
Method: PUT
URL: {{baseUrl}}/api/auth/profile
Headers: 
  Content-Type: application/json
Body (raw JSON):
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com"
}

Tests Script:
pm.test("Profile updated", function () {
    pm.response.to.have.status(200);
});

pm.test("Updated data reflected", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.user.firstName).to.eql("John");
    pm.expect(jsonData.data.user.lastName).to.eql("Doe");
});
```

#### Request 5: Refresh Token
```
Method: POST
URL: {{baseUrl}}/api/auth/refresh-token

Tests Script:
pm.test("Token refreshed", function () {
    pm.response.to.have.status(200);
});

pm.test("New access token received", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.accessToken).to.exist;
});
```

#### Request 6: Logout
```
Method: POST
URL: {{baseUrl}}/api/auth/logout

Tests Script:
pm.test("Logout successful", function () {
    pm.response.to.have.status(200);
});

pm.test("Success message", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.message).to.include("Logged out");
});
```

### Step 4: Testing Workflow

**Complete Authentication Flow:**
1. Send OTP → Copy phone from response
2. Verify OTP → Cookies automatically saved
3. Get Profile → Uses saved cookies
4. Update Profile → Uses saved cookies
5. Refresh Token → Gets new access token
6. Logout → Clears cookies

**Test with Different Scenarios:**

**Scenario 1: New User Registration**
```
Phone: 9123456789 (new number)
Expected: isNewUser = true in login response
```

**Scenario 2: Existing User Login**
```
Phone: 9876543210 (already registered)
Expected: isNewUser = false, profile data present
```

**Scenario 3: Test Phone Number**
```
Phone: 9999999999 (test number)
OTP: 111111
Expected: Instant acceptance, no SMS
```

**Scenario 4: Invalid OTP**
```
Phone: 9876543210
OTP: 123456 (wrong)
Expected: 400 error "Invalid OTP"
```

**Scenario 5: Expired Token**
```
Wait 15+ minutes after login
Call Get Profile
Expected: 401 error "Token expired"
Call Refresh Token
Expected: 200 success with new token
```

**Scenario 6: Rate Limiting**
```
Call Send OTP 4 times in quick succession
Expected: 4th call gets 400 error "Too many OTP requests"
```

### Step 5: Environment Setup

Create environments for different stages:

**Development Environment:**
```json
{
  "baseUrl": "http://localhost:5001",
  "phone": "9876543210",
  "otp": "111111"
}
```

**Staging Environment:**
```json
{
  "baseUrl": "https://staging-api.sanasilver.com",
  "phone": "9999999999",
  "otp": "111111"
}
```

**Production Environment:**
```json
{
  "baseUrl": "https://api.sanasilver.com",
  "phone": "9999999999"
}
```

---

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "statusCode": <error_code>,
  "message": "<error_message>",
  "timestamp": "<IST_timestamp>"
}
```

### HTTP Status Codes Used

| Code | Description | Common Scenarios |
|------|-------------|------------------|
| 200 | OK | Successful operations |
| 400 | Bad Request | Invalid input, validation errors |
| 401 | Unauthorized | Missing/invalid/expired tokens |
| 403 | Forbidden | Account deactivated, insufficient permissions |
| 404 | Not Found | User/resource not found |
| 409 | Conflict | Duplicate entry (rare in OTP auth) |
| 422 | Unprocessable Entity | Validation errors with details |
| 500 | Internal Server Error | Unexpected server errors |

### Common Error Messages

**Authentication Errors:**
- "Access token required"
- "Token expired. Please refresh your token"
- "Invalid token"
- "Refresh token required"
- "Refresh token expired. Please login again"

**OTP Errors:**
- "Phone number is required"
- "Invalid Indian phone number"
- "OTP sent successfully"
- "OTP not found or already used"
- "OTP has expired. Please request a new one"
- "Invalid OTP"
- "Maximum OTP attempts exceeded. Please request a new OTP"
- "Too many OTP requests. Please try again after 15 minutes"

**Account Errors:**
- "User not found"
- "Your account has been deactivated. Please contact support"
- "Token has been invalidated. Please login again"

**Validation Errors:**
- "Phone number and OTP are required"
- "First name cannot exceed 50 characters"
- "Please provide a valid email address"

### Frontend Error Handling Example

```javascript
// Axios interceptor for automatic token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        await axios.post('/api/auth/refresh-token');
        
        // Retry original request
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

---

## Security Features

### 1. OTP Security
- ✅ **Hashing:** OTPs hashed using bcrypt before storage
- ✅ **Expiry:** 5-minute expiration time
- ✅ **Single Use:** OTP marked as used after verification
- ✅ **Auto Cleanup:** Expired OTPs automatically deleted by MongoDB
- ✅ **Attempt Limiting:** Max 3 verification attempts per OTP

### 2. Rate Limiting
- ✅ **OTP Requests:** Max 3 requests per 15 minutes per phone number
- ✅ **Database Level:** Tracked in OTP collection with timestamps
- ✅ **Prevention:** Blocks spam and brute force attempts

### 3. Token Security
- ✅ **httpOnly Cookies:** Tokens not accessible via JavaScript
- ✅ **Secure Flag:** Enabled in production (HTTPS only)
- ✅ **SameSite:** Set to 'strict' to prevent CSRF attacks
- ✅ **Short-lived Access:** 15-minute expiry reduces exposure
- ✅ **Token Versioning:** Allows invalidating all tokens for a user

### 4. Phone Validation
- ✅ **Format Validation:** Ensures valid Indian phone format
- ✅ **Normalization:** Converts all formats to +91XXXXXXXXXX
- ✅ **Digit Validation:** Must start with 6-9 (Indian mobile numbers)
- ✅ **Length Check:** Exactly 10 digits after country code

### 5. User Account Security
- ✅ **Active Status:** Accounts can be deactivated
- ✅ **Token Invalidation:** tokenVersion allows logout from all devices
- ✅ **Protected Fields:** Phone, isActive, tokenVersion cannot be user-modified
- ✅ **Audit Trail:** lastLoginAt tracks user activity

### 6. Database Security
- ✅ **Unique Indexes:** Prevents duplicate phone numbers
- ✅ **Validation:** Mongoose schema validation on all fields
- ✅ **TTL Indexes:** Automatic cleanup of expired data
- ✅ **Connection Security:** MongoDB connection via secure URI

### 7. CORS & Security Headers
```javascript
// CORS Configuration
cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
})

// Recommended additional headers:
// - helmet() for security headers
// - express-rate-limit for API rate limiting
// - express-mongo-sanitize for NoSQL injection prevention
```

### 8. Future Enhancements
- [ ] Implement MSG91 for real SMS OTP
- [ ] Add IP-based rate limiting
- [ ] Implement device tracking
- [ ] Add 2FA for high-value accounts
- [ ] Implement account recovery flow
- [ ] Add email OTP as alternative
- [ ] Implement suspicious activity detection
- [ ] Add geolocation-based restrictions

---

## Development Notes

### MSG91 Integration Placeholder

In `auth.service.js`, replace the TODO comment with actual MSG91 implementation:

```javascript
// Current (Development):
const otpCode = HARDCODED_OTP; // "111111"

// TODO: Integrate MSG91 for real OTP generation and sending
// await sendSMS(normalizedPhone, `Your Sana Silver OTP is: ${otpCode}. Valid for 5 minutes.`);

// Future (Production):
import { sendSMS } from '../../shared/utils/msg91.util.js';

const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
await sendSMS(normalizedPhone, {
  template_id: process.env.MSG91_TEMPLATE_ID,
  variables: {
    otp: otpCode,
    company: "Sana Silver"
  }
});
```

### Test Phone Numbers

Update `TEST_PHONE_NUMBERS` array in `auth.service.js` to add/remove test numbers:

```javascript
const TEST_PHONE_NUMBERS = [
  "+919999999999",  // Dev team
  "+918888888888",  // QA team
  "+917777777777"   // Staging
];
```

### OTP Configuration

Modify OTP settings in `otp.model.js`:

```javascript
// Change expiry time (default: 5 minutes)
default: () => new Date(Date.now() + 5 * 60 * 1000)

// Change max attempts (default: 3)
max: 3
```

### Token Expiry Configuration

Modify in `.env`:

```env
JWT_ACCESS_EXPIRES_IN=15m   # Access token expiry
JWT_REFRESH_EXPIRES_IN=7d   # Refresh token expiry
```

---

## Troubleshooting

### Issue: Cookies not being saved in Postman
**Solution:** 
- Enable "Automatically follow redirects" in Postman settings
- Check "Save cookies" option in request settings
- Use collection-level cookie management

### Issue: 401 Unauthorized on protected routes
**Solution:**
- Verify access token cookie exists in request
- Check token expiry (call refresh-token if expired)
- Ensure cookies are being sent with requests

### Issue: "Too many OTP requests" error
**Solution:**
- Wait 15 minutes before requesting new OTP
- Use test phone numbers for unlimited OTP requests
- Clear OTP collection in database for development

### Issue: Phone number validation fails
**Solution:**
- Ensure phone number is 10 digits
- Must start with 6, 7, 8, or 9
- Remove any spaces or special characters
- Example valid: 9876543210

### Issue: OTP expired immediately
**Solution:**
- Check server timezone matches IST
- Verify MongoDB server time
- OTP validity is 5 minutes from creation

### Issue: Refresh token not working
**Solution:**
- Ensure refresh token cookie exists
- Check tokenVersion matches in database
- Verify refresh token hasn't expired (7 days)
- User might have been logged out from all devices

---

## Support

For issues or questions:
- **Backend Developer:** Check logs in terminal (IST timestamps)
- **Database:** MongoDB Atlas cluster `SanaSilver`
- **Environment:** Development (localhost:5001)
- **Log Levels:** Use logger.debug() for development debugging

---

**Last Updated:** January 31, 2026  
**API Version:** 1.0.0  
**Backend Server:** http://localhost:5001  
**Database:** MongoDB Atlas (SanaSilver)
