# Authentication Cookie Configuration Guide

## Overview

This application uses **httpOnly cookies** for JWT token storage to prevent XSS attacks. Cookie settings must be configured correctly for different environments to ensure authentication works properly.

---

## Cookie Settings Explained

### httpOnly

- **Value**: `true` (always)
- **Purpose**: Prevents JavaScript from accessing cookies (security against XSS)
- **Impact**: Cookies are sent automatically with requests but cannot be read by client-side code

### secure

- **Local Dev**: `false`
- **Production**: `true` (required for HTTPS)
- **Purpose**: When true, cookies are only sent over HTTPS connections
- **Impact**: Must be false in local dev (HTTP) or cookies won't be sent

### sameSite

- **Local Dev**: `"lax"` (recommended) or `"none"` (with secure: true)
- **Production**: `"strict"` (most secure)
- **Purpose**: Controls cross-site cookie behavior (CSRF protection)
- **Values**:
    - `"strict"`: Cookies only sent with same-origin requests (breaks cross-port in dev)
    - `"lax"`: Allows cookies with top-level navigation (works for most cases)
    - `"none"`: Allows all cross-site requests (requires secure: true and HTTPS)

---

## Environment Configurations

### 1. Local Development

**Scenario**: Backend on `localhost:5001`, Frontend on `localhost:5174`

**Problem**: Different ports = different origins = cross-origin request

**Solution**:

```javascript
// .env
NODE_ENV=development
COOKIE_SAME_SITE=lax

// Cookie options
{
  httpOnly: true,
  secure: false,              // HTTP allowed
  sameSite: "lax",            // Cross-port allowed
  maxAge: 15 * 60 * 1000     // 15 minutes
}
```

**Backend CORS**:

```javascript
cors({
    origin: "http://localhost:5174",
    credentials: true, // Required for cookies
});
```

**Frontend Axios**:

```javascript
axios.create({
    withCredentials: true, // Send cookies with requests
});
```

---

### 2. Hosted Development (Different Domains)

**Scenario**: Backend on `api-dev.example.com`, Frontend on `app-dev.example.com`

**Configuration**:

```javascript
// .env
NODE_ENV=development
COOKIE_SAME_SITE=none
COOKIE_SECURE=true

// Cookie options
{
  httpOnly: true,
  secure: true,               // HTTPS required
  sameSite: "none",           // Cross-domain allowed
  maxAge: 15 * 60 * 1000
}
```

**Requirements**:

- Both domains must use HTTPS
- CORS must allow credentials from frontend domain
- `sameSite: "none"` requires `secure: true`

---

### 3. Hosted Development (Same Domain)

**Scenario**: Backend on `dev.example.com/api`, Frontend on `dev.example.com`

**Configuration**:

```javascript
// .env
NODE_ENV=development
COOKIE_SAME_SITE=lax

// Cookie options
{
  httpOnly: true,
  secure: true,               // HTTPS
  sameSite: "lax",            // Same domain, relaxed
  maxAge: 15 * 60 * 1000
}
```

**Advantages**:

- No CORS issues (same origin)
- More secure than `sameSite: "none"`

---

### 4. Production

**Scenario**: Backend on `api.example.com`, Frontend on `app.example.com` OR same domain

**Same Domain (Recommended)**:

```javascript
// .env
NODE_ENV=production
COOKIE_SAME_SITE=strict

// Cookie options
{
  httpOnly: true,
  secure: true,               // HTTPS enforced
  sameSite: "strict",         // Maximum security
  maxAge: 15 * 60 * 1000
}
```

**Different Domains**:

```javascript
// .env
NODE_ENV=production
COOKIE_SAME_SITE=none
COOKIE_SECURE=true

// Cookie options (less secure, not recommended)
{
  httpOnly: true,
  secure: true,
  sameSite: "none",           // Required for cross-domain
  maxAge: 15 * 60 * 1000
}
```

---

## Common Issues & Solutions

### Issue 1: Cookies not being set in local development

**Symptoms**: Login succeeds but user not authenticated on subsequent requests

**Causes**:

- `sameSite: "strict"` blocks cross-port cookies
- `secure: true` with HTTP connection

**Solution**:

```javascript
// Change in .env
NODE_ENV = development;
COOKIE_SAME_SITE = lax;

// jwt.util.js will use these settings
```

---

### Issue 2: Cookies work locally but not in production

**Symptoms**: Auth works on localhost but fails on deployed environment

**Causes**:

- Missing HTTPS (secure: true requires it)
- CORS not configured for credentials
- Domain mismatch

**Solutions**:

1. Ensure HTTPS is enabled
2. Set CORS origin to frontend domain
3. Set `credentials: true` in CORS config
4. Use `sameSite: "none"` only if cross-domain required

---

### Issue 3: "Blocked by CORS policy: credentials flag is true"

**Symptoms**: Browser console shows CORS error with credentials

**Cause**: CORS not configured for credentials

**Solution**:

```javascript
// Backend
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true, // REQUIRED
    }),
);

// Frontend
axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    withCredentials: true, // REQUIRED
});
```

---

### Issue 4: Login successful but page refresh loses authentication

**Symptoms**: User logged in but refreshing page logs them out

**Causes**:

- Cookies not being saved
- Frontend not reading user from localStorage
- Token refresh not working

**Solution**:

1. Check cookie settings match environment
2. Verify `AuthContext` stores user in localStorage
3. Check token refresh endpoint is working
4. Ensure `withCredentials: true` on all axios requests

---

## Testing Checklist

### Local Development

- [ ] Can send OTP
- [ ] Can verify OTP and login
- [ ] Cookies visible in browser DevTools → Application → Cookies
- [ ] Page refresh maintains authentication
- [ ] Token refresh works on 401 errors
- [ ] Logout clears cookies

### Production Deployment

- [ ] HTTPS enforced on both backend and frontend
- [ ] CORS allows frontend domain with credentials
- [ ] Login flow works end-to-end
- [ ] Cookies have `secure` and `httpOnly` flags
- [ ] Token refresh works
- [ ] Sessions persist across browser tabs
- [ ] Logout works properly

---

## Environment Variables Reference

Add these to your `.env`:

```bash
# Required
NODE_ENV=development|production

# Optional (defaults shown)
COOKIE_SAME_SITE=lax       # Options: strict|lax|none
COOKIE_SECURE=auto         # Options: true|false|auto (auto = true if NODE_ENV=production)
```

---

## Backend Implementation

See `shared/utils/jwt.util.js` for cookie option functions:

- `getAccessTokenCookieOptions()` - 15-minute access token
- `getRefreshTokenCookieOptions()` - 7-day refresh token

Both read from environment variables to configure `secure` and `sameSite` settings.

---

## Frontend Implementation

See `client/frontend/src/api/axios.js`:

- Base axios instance with `withCredentials: true`
- Automatic token refresh on 401 errors
- Handles session expiration

---

## Security Best Practices

1. ✅ **Always use httpOnly**: Prevents XSS token theft
2. ✅ **Use secure in production**: Force HTTPS
3. ✅ **Use strict sameSite in production**: Maximum CSRF protection
4. ✅ **Short-lived access tokens**: 15 minutes maximum
5. ✅ **Moderate refresh tokens**: 7 days with rotation
6. ✅ **CORS whitelist**: Only allow known frontend domains
7. ✅ **Validate tokens server-side**: Never trust client assertions

---

## Quick Reference

| Environment               | httpOnly | secure | sameSite | HTTPS | Notes            |
| ------------------------- | -------- | ------ | -------- | ----- | ---------------- |
| Local Dev (cross-port)    | ✅       | ❌     | lax      | ❌    | Development only |
| Hosted Dev (same domain)  | ✅       | ✅     | lax      | ✅    | Good for staging |
| Hosted Dev (cross-domain) | ✅       | ✅     | none     | ✅    | Less secure      |
| Production (same domain)  | ✅       | ✅     | strict   | ✅    | **Recommended**  |
| Production (cross-domain) | ✅       | ✅     | none     | ✅    | Use if necessary |

---

## Support

If authentication issues persist:

1. Check browser console for CORS errors
2. Check `Network` tab for cookie headers
3. Check `Application → Cookies` for stored cookies
4. Verify `.env` matches the environment configuration guide above
5. Test with different browsers (Safari has stricter cookie policies)
