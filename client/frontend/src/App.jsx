import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import PublicRoute from "./components/common/PublicRoute";

// Page imports
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Wishlist from "./pages/Wishlist";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import ProductReviewsPage from "./pages/ProductReviewsPage";
import FAQPage from "./pages/FAQPage";
import ShippingPolicy from "./pages/ShippingPolicy";
import ReturnsPolicy from "./pages/ReturnsPolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";

const App = () => {
    return (
        <Layout>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/products/:slug" element={<ProductDetail />} />
                <Route
                    path="/products/:slug/reviews"
                    element={<ProductReviewsPage />}
                />
                <Route path="/cart" element={<Cart />} />

                {/* Public Only Routes (redirect if logged in) */}
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    }
                />

                {/* Protected Routes (require authentication) */}
                <Route
                    path="/checkout"
                    element={
                        <ProtectedRoute>
                            <Checkout />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/checkout/success"
                    element={
                        <ProtectedRoute>
                            <CheckoutSuccess />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/orders"
                    element={
                        <ProtectedRoute>
                            <Orders />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/orders/:orderNumber"
                    element={
                        <ProtectedRoute>
                            <OrderDetail />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/wishlist"
                    element={
                        <ProtectedRoute>
                            <Wishlist />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                />

                {/* Error Routes */}
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Policy & Info Routes */}
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/shipping" element={<ShippingPolicy />} />
                <Route path="/returns" element={<ReturnsPolicy />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsConditions />} />

                <Route path="*" element={<NotFound />} />
            </Routes>
        </Layout>
    );
};

export default App;
