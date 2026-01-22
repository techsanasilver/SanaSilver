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
import Unauthorized from "./pages/Unauthorized";

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
                <Route path="/products" element={<Products />} />
                <Route path="/products/add" element={<AddProduct />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/products/:id/edit" element={<EditProduct />} />

                {/* Other Routes */}
                <Route path="/orders" element={<div>Orders Page</div>} />
                <Route path="/customers" element={<div>Customers Page</div>} />
                <Route
                    path="/bulk-operations"
                    element={<div>Bulk Operations Page</div>}
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
