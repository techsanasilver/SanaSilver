# Frontend Setup Documentation

## Overview

The Sana Silver Admin Frontend has been configured with a robust foundation following modern React best practices.

## ✅ Completed Setup

### 1. **Styling - TailwindCSS v4**

-   Custom theme variables configured in `index.css`
-   Global color palette (primary, secondary, accent, success, warning, danger, info)
-   Custom fonts, spacing, shadows, and transitions
-   Responsive design utilities

### 2. **Routing - React Router Dom v6**

-   Configured in `App.jsx`
-   Public routes: `/login`, `/unauthorized`
-   Protected routes: `/` (Home)
-   Catch-all redirect to home

### 3. **State Management - Context API**

-   **AuthContext**: User authentication state, login/logout, role/permission checks
-   **NotificationContext**: Toast notifications with success/error/warning/info types
-   All contexts wrapped in `main.jsx`

### 4. **HTTP Client - Axios**

-   Configured instance with base URL from environment variables
-   Request interceptor: Auto-attaches access token
-   Response interceptor: Handles token refresh on 401 errors
-   Helper function for error handling (`handleApiError`)

### 5. **API Layer**

-   `auth.api.js`: Login, logout, profile, password management
-   `product.api.js`: CRUD operations for products and variants
-   `bulk.api.js`: Import/export operations with blob handling

### 6. **Utilities**

-   **logger.util.js**: Centralized logging (development/production modes)
-   **errorHandler.util.js**: Global error handling with categorization
-   **axios.js**: HTTP client configuration

### 7. **Common Components**

-   **Loader**: Reusable loading spinner (sm/md/lg/xl sizes, multiple variants, fullScreen option)
-   **ErrorBoundary**: React error boundary with fallback UI
-   **ToastContainer**: Toast notification system with auto-dismiss
-   **ProtectedRoute**: Route wrapper for authentication/authorization

### 8. **Pages**

-   **Login**: Authentication page with form validation
-   **Home**: Dashboard with quick stats and actions
-   **Unauthorized**: 403 access denied page

### 9. **Environment Configuration**

-   `.env` and `.env.example` created
-   `VITE_API_BASE_URL` configured for backend API

### 10. **Code Standards**

-   4-space indentation
-   Consistent file structure
-   JSDoc comments for documentation
-   Clean, maintainable code

## 📁 Folder Structure

```
frontend/
├── src/
│   ├── api/
│   │   ├── auth.api.js
│   │   ├── product.api.js
│   │   └── bulk.api.js
│   ├── components/
│   │   └── common/
│   │       ├── ErrorBoundary.jsx
│   │       ├── Loader.jsx
│   │       ├── ProtectedRoute.jsx
│   │       └── ToastContainer.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── NotificationContext.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   └── Unauthorized.jsx
│   ├── utils/
│   │   ├── axios.js
│   │   ├── errorHandler.util.js
│   │   └── logger.util.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env
├── .env.example
└── package.json
```

## 🚀 How to Use

### Running the Application

```bash
npm run dev
```

### Authentication Flow

1. User visits protected route → redirected to `/login`
2. User enters credentials → calls `login` API
3. On success → stores tokens in localStorage → updates AuthContext
4. User can access protected routes

### Making API Calls

```javascript
import { getProducts } from "../api/product.api";
import { useNotification } from "../context/NotificationContext";
import { handleApiError } from "../utils/axios";

const { error } = useNotification();

try {
    const response = await getProducts({ page: 1, limit: 10 });
    console.log(response.data);
} catch (err) {
    const errorMessage = handleApiError(err);
    error(errorMessage);
}
```

### Showing Notifications

```javascript
import { useNotification } from "../context/NotificationContext";

const { success, error, warning, info } = useNotification();

success("Product created successfully!");
error("Failed to delete product");
warning("Low stock alert");
info("Data refreshed");
```

### Using Auth Context

```javascript
import { useAuth } from "../context/AuthContext";

const { user, isAuthenticated, hasRole, hasPermission, logout } = useAuth();

if (hasRole("admin")) {
    // Show admin features
}

if (hasPermission("products.delete")) {
    // Show delete button
}
```

### Protected Routes

```javascript
<Route
    path="/products"
    element={
        <ProtectedRoute requireRole="admin">
            <ProductsPage />
        </ProtectedRoute>
    }
/>
```

## 🎨 Styling with Tailwind

Use custom theme variables:

```jsx
<div className="bg-primary text-white">Primary Button</div>
<div className="bg-accent text-text">Accent Badge</div>
<div className="shadow-md rounded-lg p-4">Card</div>
```

Available color classes:

-   `primary`, `secondary`, `accent`
-   `success`, `warning`, `danger`, `info`
-   `background`, `surface`, `text`, `text-secondary`, `border`

## 📝 Next Steps

To extend the application:

1. **Create more pages**: Add Product Management, Bulk Operations, Settings, etc.
2. **Build forms**: Use the Login page as a template for form validation
3. **Add layouts**: Create Layout components with Navbar, Sidebar, Footer
4. **Implement features**: Use existing API layer and contexts
5. **Add more components**: Tables, Modals, Dropdowns, etc.

## 🔐 Security Notes

-   Tokens stored in localStorage (consider httpOnly cookies for production)
-   Automatic token refresh on 401 errors
-   CORS should be configured on backend
-   Always validate user input
-   Protect sensitive routes with `ProtectedRoute`

## 📦 Dependencies Installed

-   `axios` (^1.x) - HTTP client
-   `react-router-dom` (^6.x) - Routing
-   `tailwindcss` (v4) - Already installed
-   `react` (19.2.0) - Already installed
-   `vite` (7) - Already installed

---

**Setup completed successfully!** The frontend is now ready for development. 🎉
