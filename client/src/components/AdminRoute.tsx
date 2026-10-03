import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { btn } from "../lib/ui";
import { useAuthService } from "../services/auth.service";

/** Shows the admin area to admins only. This is for display; the server enforces the real rule. */
export default function AdminRoute() {
    const user = useAuthService((s) => s.userInfo);
    const location = useLocation();

    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

    if (user.role !== "ADMIN") {
        return (
            <div className="mx-auto max-w-md px-4 py-28 text-center">
                <p className="font-display text-6xl font-bold text-accent-text">403</p>
                <h1 className="mt-4 font-display text-2xl font-bold">You don’t have access to this page.</h1>
                <p className="mt-3 text-dim">This area is for administrators only.</p>
                <Link to="/" className={`${btn("primary")} mt-8`}>
                    Back to games
                </Link>
            </div>
        );
    }

    return <Outlet />;
}
