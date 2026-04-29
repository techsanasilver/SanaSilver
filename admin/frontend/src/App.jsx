import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/common/ProtectedRoute";
import PublicRoute from "./components/common/PublicRoute";
import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Products from "./pages/products/Products";
import ProductDetail from "./pages/products/ProductDetail";
import AddProduct from "./pages/products/AddProduct";
import EditProduct from "./pages/products/EditProduct";
import Categories from "./pages/products/Categories";
import BulkOperations from "./pages/BulkOperations";
import Banners from "./pages/Banners";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Unauthorized from "./pages/Unauthorized";
import Coupons from "./pages/Coupons";
import Reviews from "./pages/Reviews";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Admins from "./pages/Admins";

const App = () => {
    return (
        <Routes>
            {/* Public Routes - No Layout - Redirects if authenticated */}
            <Route
                path="/login"
                element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                }
            />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected Routes - With Layout */}
            <Route
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route path="/" element={<Home />} />

                {/* Products Routes */}
                <Route
                    path="/products"
                    element={
                        <ProtectedRoute requirePermission="products.view">
                            <Products />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/products/add"
                    element={
                        <ProtectedRoute requirePermission="products.create">
                            <AddProduct />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/categories"
                    element={
                        <ProtectedRoute requirePermission="categories.view">
                            <Categories />
                        </ProtectedRoute>
                    }
                />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route
                    path="/products/:id/edit"
                    element={
                        <ProtectedRoute requirePermission="products.edit">
                            <EditProduct />
                        </ProtectedRoute>
                    }
                />

                {/* Orders Routes */}
                <Route
                    path="/orders"
                    element={
                        <ProtectedRoute requirePermission="orders.view">
                            <Orders />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/orders/:orderId"
                    element={
                        <ProtectedRoute requirePermission="orders.view">
                            <OrderDetail />
                        </ProtectedRoute>
                    }
                />

                {/* Other Routes */}
                <Route
                    path="/customers"
                    element={
                        <ProtectedRoute requirePermission="users.view">
                            <Customers />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/customers/:customerId"
                    element={
                        <ProtectedRoute requirePermission="users.view">
                            <CustomerDetail />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/banners"
                    element={
                        <ProtectedRoute requirePermission="banners.view">
                            <Banners />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/coupons"
                    element={
                        <ProtectedRoute requirePermission="coupons.view">
                            <Coupons />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/reviews"
                    element={
                        <ProtectedRoute requirePermission="reviews.view">
                            <Reviews />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/bulk-operations"
                    element={
                        <ProtectedRoute requirePermission="bulk-operations.export">
                            <BulkOperations />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admins"
                    element={
                        <ProtectedRoute requireRole="super-admin">
                            <Admins />
                        </ProtectedRoute>
                    }
                />
                <Route path="/analytics" element={<div>Analytics Page</div>} />
                <Route path="/settings" element={<div>Settings Page</div>} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default App;
