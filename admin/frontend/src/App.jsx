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
                <Route path="/categories" element={<Categories />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/products/:id/edit" element={<EditProduct />} />

                {/* Orders Routes */}
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:orderId" element={<OrderDetail />} />

                {/* Other Routes */}
                <Route path="/customers" element={<Customers />} />
                <Route
                    path="/customers/:customerId"
                    element={<CustomerDetail />}
                />
                <Route path="/banners" element={<Banners />} />
                <Route path="/coupons" element={<Coupons />} />
                <Route path="/reviews" element={<Reviews />} />
                <Route path="/bulk-operations" element={<BulkOperations />} />
                <Route path="/analytics" element={<div>Analytics Page</div>} />
                <Route path="/settings" element={<div>Settings Page</div>} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default App;
