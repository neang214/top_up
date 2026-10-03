import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthService } from "../services/auth.service";

export default function ProtectedRoute() {
    const user = useAuthService((s) => s.userInfo);
    const location = useLocation();

    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    return <Outlet />;
}
