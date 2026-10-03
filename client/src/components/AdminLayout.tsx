import { NavLink, Outlet } from "react-router-dom";

const tabs = [
    { to: "/admin", label: "Overview", end: true },
    { to: "/admin/orders", label: "Orders", end: false },
    { to: "/admin/topups", label: "Top-ups", end: false },
    { to: "/admin/games", label: "Games", end: false },
];

export default function AdminLayout() {
    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <p className="text-sm font-semibold text-accent-text">Admin</p>
            <nav aria-label="Admin sections" className="-mx-4 mt-3 overflow-x-auto border-b border-line px-4">
                <ul className="flex gap-1">
                    {tabs.map((t) => (
                        <li key={t.to}>
                            <NavLink
                                to={t.to}
                                end={t.end}
                                className={({ isActive }) =>
                                    `-mb-px block whitespace-nowrap border-b-2 px-4 py-3 text-[15px] font-semibold transition-colors ${
                                        isActive ? "border-accent text-ink" : "border-transparent text-dim hover:text-ink"
                                    }`
                                }
                            >
                                {t.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="pt-8">
                <Outlet />
            </div>
        </div>
    );
}
