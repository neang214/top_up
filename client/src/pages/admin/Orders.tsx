import { useState } from "react";
import { Link } from "react-router-dom";
import Chips from "../../components/Chips";
import { SearchIcon } from "../../components/icons";
import StatusPill, { stageOf } from "../../components/StatusPill";
import { dateTime, money } from "../../lib/format";
import { inputClass } from "../../lib/ui";
import { useLoad } from "../../lib/useLoad";
import { getAllOrders } from "../../services/admin.service";

type Filter = "all" | "wait" | "work" | "good" | "bad";

const PAGE = 25;

const cols = "md:grid md:grid-cols-[1.4fr_1fr_1fr_0.7fr_0.6fr_1fr] md:items-center md:gap-4";

export default function Orders() {
    const { data: orders, error, loading, reload } = useLoad(getAllOrders);
    const [filter, setFilter] = useState<Filter>("all");
    const [query, setQuery] = useState("");
    const [shown, setShown] = useState(PAGE);

    if (loading && !orders) return <div className="h-96 animate-pulse rounded-3xl bg-raised" />;

    if (error || !orders) {
        return (
            <div className="rounded-3xl border border-dashed border-line px-6 py-14 text-center">
                <p className="font-semibold">{error ?? "No data."}</p>
                <button type="button" onClick={reload} className="mt-3 text-sm font-semibold text-accent-text underline underline-offset-4">
                    Try again
                </button>
            </div>
        );
    }

    const count = (f: Filter) => (f === "all" ? orders.length : orders.filter((o) => stageOf(o).tone === f).length);
    const term = query.trim().toLowerCase();

    const rows = orders.filter((o) => {
        if (filter !== "all" && stageOf(o).tone !== filter) return false;
        if (!term) return true;
        return (
            o.orderNumber.toLowerCase().includes(term) ||
            (o.topUp?.playerId ?? "").toLowerCase().includes(term) ||
            (o.items[0]?.productName ?? "").toLowerCase().includes(term)
        );
    });

    return (
        <div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <Chips
                    value={filter}
                    onChange={(f) => {
                        setFilter(f);
                        setShown(PAGE);
                    }}
                    options={[
                        { value: "all", label: "All", count: count("all") },
                        { value: "wait", label: "Waiting", count: count("wait") },
                        { value: "work", label: "Delivering", count: count("work") },
                        { value: "good", label: "Delivered", count: count("good") },
                        { value: "bad", label: "Failed or cancelled", count: count("bad") },
                    ]}
                />
                <div className="relative w-full lg:max-w-xs">
                    <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dim" />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setShown(PAGE);
                        }}
                        placeholder="Order number or Player ID"
                        aria-label="Search orders"
                        className={`${inputClass} pl-12`}
                    />
                </div>
            </div>

            {rows.length === 0 ? (
                <p className="mt-6 rounded-2xl border border-dashed border-line px-5 py-14 text-center text-dim">
                    {orders.length === 0 ? "No orders yet." : "No orders match your filters."}
                </p>
            ) : (
                <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface">
                    <div className={`hidden border-b border-line bg-raised px-5 py-3 text-xs font-semibold text-dim ${cols}`}>
                        <span>Order</span>
                        <span>Pack</span>
                        <span>Player ID</span>
                        <span>Customer</span>
                        <span className="text-right">Total</span>
                        <span className="text-right">Status</span>
                    </div>
                    <ul className="divide-y divide-line">
                        {rows.slice(0, shown).map((o) => (
                            <li key={o.id}>
                                <Link
                                    to={`/orders/${o.id}`}
                                    className={`flex flex-col gap-1.5 px-5 py-4 transition-colors hover:bg-raised ${cols}`}
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate font-semibold">{o.orderNumber}</span>
                                        <span className="block truncate text-sm text-dim">{dateTime(o.createdAt)}</span>
                                    </span>
                                    <span className="truncate">{o.items[0]?.productName ?? "—"}</span>
                                    <span className="truncate text-sm md:text-[15px]">
                                        <span className="text-dim md:hidden">Player </span>
                                        {o.topUp?.playerId ?? "—"}
                                        {o.topUp?.zoneId ? ` (${o.topUp.zoneId})` : ""}
                                    </span>
                                    <span className="text-sm text-dim md:text-[15px]">{o.userId ? "Member" : "Guest"}</span>
                                    <span className="font-display text-[15px] font-semibold md:text-right">{money(o.total, o.currency)}</span>
                                    <span className="md:text-right">
                                        <StatusPill stage={stageOf(o)} />
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {rows.length > shown && (
                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => setShown((n) => n + PAGE)}
                        className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-raised"
                    >
                        Show more ({rows.length - shown} left)
                    </button>
                </div>
            )}
        </div>
    );
}
