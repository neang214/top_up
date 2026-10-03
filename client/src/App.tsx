import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import AdminRoute from "./components/AdminRoute";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminGames from "./pages/admin/Games";
import AdminOrders from "./pages/admin/Orders";
import AdminPacks from "./pages/admin/Packs";
import AdminTopUps from "./pages/admin/TopUps";
import Auth from "./pages/Auth";
import Checkout from "./pages/Checkout";
import Game from "./pages/Game";
import Home from "./pages/Home";
import MyOrders from "./pages/MyOrders";
import NotFound from "./pages/NotFound";
import Order from "./pages/Order";
import { useAuthService } from "./services/auth.service";

export default function App() {
    const checkAuth = useAuthService((s) => s.checkAuth);
    const [ready, setReady] = useState(false);

    // Ask the server once whether the login cookie is still valid before drawing protected pages.
    useEffect(() => {
        checkAuth().finally(() => setReady(true));
    }, [checkAuth]);

    if (!ready) {
        return (
            <div className="grid min-h-screen place-items-center" role="status" aria-label="Loading">
                <span className="size-8 animate-spin rounded-full border-2 border-line border-t-accent" />
            </div>
        );
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="games/:slug" element={<Game />} />
                    <Route path="checkout/:orderId" element={<Checkout />} />
                    <Route path="orders/:orderId" element={<Order />} />
                    <Route path="login" element={<Auth mode="login" />} />
                    <Route path="register" element={<Auth mode="register" />} />
                    <Route element={<ProtectedRoute />}>
                        <Route path="orders" element={<MyOrders />} />
                    </Route>
                    <Route element={<AdminRoute />}>
                        <Route path="admin" element={<AdminLayout />}>
                            <Route index element={<AdminDashboard />} />
                            <Route path="orders" element={<AdminOrders />} />
                            <Route path="topups" element={<AdminTopUps />} />
                            <Route path="games" element={<AdminGames />} />
                            <Route path="games/:gameId/packs" element={<AdminPacks />} />
                        </Route>
                    </Route>
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
