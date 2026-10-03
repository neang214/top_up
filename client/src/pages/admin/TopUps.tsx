import { useState } from "react";
import { Link } from "react-router-dom";
import Chips from "../../components/Chips";
import { SearchIcon } from "../../components/icons";
import StatusPill, { topUpStage } from "../../components/StatusPill";
import { dateTime, money } from "../../lib/format";
import { inputClass } from "../../lib/ui";
import { useLoad } from "../../lib/useLoad";
import { getAllTopUps } from "../../services/admin.service";
import type { TopUpStatus } from "../../services/order.service";

type Filter = "all" | TopUpStatus;

const PAGE = 25;
const cols = "md:grid md:grid-cols-[1fr_1fr_1.2fr_0.7fr_1fr] md:items-center md:gap-4";

export default function TopUps() {
    const { data: topUps, error, loading, reload } = useLoad(getAllTopUps);
    const [filter, setFilter] = useState<Filter>("all");
    const [query, setQuery] = useState("");
    const [shown, setShown] = useState(PAGE);

    if (loading && !topUps) return <div className="h-96 animate-pulse rounded-3xl bg-raised" />;

    if (error || !topUps) {
        return (
            <div className="rounded-3xl border border-dashed border-line px-6 py-14 text-center">
                <p className="font-semibold">{error ?? "No data."}</p>
                <button type="button" onClick={reload} className="mt-3 text-sm font-semibold text-accent-text underline underline-offset-4">
                    Try again
                </button>
            </div>
        );
    }

    const count = (f: Filter) => (f === "all" ? topUps.length : topUps.filter((t) => t.status === f).length);
    const term = query.trim().toLowerCase();

    const rows = topUps.filter((t) => {
        if (filter !== "all" && t.status !== filter) return false;
        if (!term) return true;
        return t.playerId.toLowerCase().includes(term) || t.order.orderNumber.toLowerCase().includes(term);
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
                        { value: "PENDING", label: "Pending", count: count("PENDING") },
                        { value: "PROCESSING", label: "Processing", count: count("PROCESSING") },
                        { value: "COMPLETED", label: "Delivered", count: count("COMPLETED") },
                        { value: "FAILED", label: "Failed", count: count("FAILED") },
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
                        placeholder="Player ID or order number"
                        aria-label="Search top-ups"
                        className={`${inputClass} pl-12`}
                    />
                </div>
            </div>

            {rows.length === 0 ? (
                <p className="mt-6 rounded-2xl border border-dashed border-line px-5 py-14 text-center text-dim">
                    {topUps.length === 0 ? "No top-ups yet." : "No top-ups match your filters."}
                </p>
            ) : (
                <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface">
                    <div className={`hidden border-b border-line bg-raised px-5 py-3 text-xs font-semibold text-dim ${cols}`}>
                        <span>Player ID</span>
                        <span>Zone ID</span>
                        <span>Order</span>
                        <span className="text-right">Amount</span>
                        <span className="text-right">Status</span>
                    </div>
                    <ul className="divide-y divide-line">
                        {rows.slice(0, shown).map((t) => (
                            <li key={t.id}>
                                <Link
                                    to={`/orders/${t.orderId}`}
                                    className={`flex flex-col gap-1.5 px-5 py-4 transition-colors hover:bg-raised ${cols}`}
                                >
                                    <span className="truncate font-semibold">{t.playerId}</span>
                                    <span className="truncate text-sm text-dim md:text-[15px]">
                                        <span className="md:hidden">Zone </span>
                                        {t.zoneId ?? "—"}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block truncate">{t.order.orderNumber}</span>
                                        <span className="block truncate text-sm text-dim">{dateTime(t.order.createdAt)}</span>
                                    </span>
                                    <span className="font-display text-[15px] font-semibold md:text-right">
                                        {money(t.order.total, t.order.currency)}
                                    </span>
                                    <span className="md:text-right">
                                        <StatusPill stage={topUpStage(t.status)} />
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
