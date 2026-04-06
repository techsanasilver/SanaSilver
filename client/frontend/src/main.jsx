import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import Maintenance from "./pages/Maintenance.jsx";
import { AuthProvider } from "./context/AuthContext";
import { CategoryProvider } from "./context/CategoryContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import ErrorBoundary from "./components/common/ErrorBoundary";

// Set VITE_MAINTENANCE_MODE=true in .env to show the maintenance page
const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === "true";

createRoot(document.getElementById("root")).render(
    // <StrictMode>
    <ErrorBoundary>
        {isMaintenanceMode ? (
            <Maintenance />
        ) : (
            <BrowserRouter>
                <AuthProvider>
                    <CategoryProvider>
                        <CartProvider>
                            <WishlistProvider>
                                <App />
                            </WishlistProvider>
                        </CartProvider>
                    </CategoryProvider>
                </AuthProvider>
            </BrowserRouter>
        )}
    </ErrorBoundary>,
    // </StrictMode>,
);
