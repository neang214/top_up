import { Link } from "react-router-dom";
import StatusPill, { stageOf } from "../../components/StatusPill";
import { dateTime, money } from "../../lib/format";
import { useLoad } from "../../lib/useLoad";
import { getAllOrders } from "../../services/admin.service";
import type { Order } from "../../services/order.service";

const dayKey = (d: Date) => d.toLocaleDateString("en-CA");
const STUCK_MS = 10 * 60 * 1000;

const wholeDollars = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const minutesAgo = (iso: string) => Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));

const attentionReason = (o: Order): string | null => {
    if (o.status === "FAILED" || o.topUp?.status === "FAILED") return "Top-up failed";
    if (o.status === "PAID" && o.paidAt && Date.now() - new Date(o.paidAt).getTime() > STUCK_MS)
        return `Paid ${minutesAgo(o.paidAt)} min ago, not delivered`;
    return null;
};

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
    return (
        <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-sm text-dim">{label}</p>
            <p className="mt-2 font-display text-3xl font-bold tracking-tight tabular-nums">{value}</p>
            {note && <p className="mt-1 text-xs text-dim">{note}</p>}
        </div>
    );
}

export default function Dashboard() {
    const { data: orders, error, loading, reload } = useLoad(getAllOrders);

    if (loading && !orders) {
        return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-28 animate-pulse rounded-2xl bg-raised" />
                ))}
            </div>
        );
    }

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

    const today = dayKey(new Date());
    const earned = orders.filter((o) => o.status === "PAID" || o.status === "COMPLETED");
    const revenue = earned.reduce((sum, o) => sum + Number(o.total), 0);
    const ordersToday = orders.filter((o) => dayKey(new Date(o.createdAt)) === today).length;
    const delivered = orders.filter((o) => o.status === "COMPLETED").length;
    const waiting = orders.filter((o) => o.status === "PENDING").length;

    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { key: dayKey(d), label: d.toLocaleDateString("en-US", { weekday: "short" }), total: 0 };
    });
    for (const o of earned) {
        const k = dayKey(new Date(o.paidAt ?? o.createdAt));
        const slot = days.find((d) => d.key === k);
        if (slot) slot.total += Number(o.total);
    }
    const peak = Math.max(...days.map((d) => d.total), 1);

    const attention = orders.flatMap((o) => {
        const reason = attentionReason(o);
        return reason ? [{ order: o, reason }] : [];
    });

    return (
        <div className="space-y-10">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Revenue" value={money(revenue)} note="Paid and delivered orders" />
                <Stat label="Orders today" value={String(ordersToday)} />
                <Stat label="Delivered" value={String(delivered)} note={`of ${orders.length} orders`} />
                <Stat label="Waiting for payment" value={String(waiting)} />
            </div>

            <section aria-labelledby="chart-heading" className="rounded-3xl border border-line bg-surface p-6">
                <h2 id="chart-heading" className="font-display text-lg font-semibold">
                    Revenue, last 7 days
                </h2>
                <div className="mt-6 flex h-44 items-end gap-2 sm:gap-4" role="img" aria-label="Bar chart of revenue per day for the last 7 days">
                    {days.map((d) => (
                        <div
                            key={d.key}
                            title={`${d.label}: ${money(d.total)}`}
                            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                        >
                            <span className="text-xs font-semibold tabular-nums text-dim">{d.total > 0 ? wholeDollars(d.total) : ""}</span>
                            <div
                                className="w-full rounded-t-lg bg-accent"
                                style={{ height: `${Math.max(d.total > 0 ? 6 : 2, (d.total / peak) * 100)}%`, opacity: d.total > 0 ? 1 : 0.25 }}
                            />
                            <span className="text-xs text-dim">{d.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section aria-labelledby="attention-heading">
                <h2 id="attention-heading" className="font-display text-lg font-semibold">
                    Needs attention
                </h2>
                {attention.length === 0 ? (
                    <p className="mt-4 rounded-2xl border border-line bg-surface px-5 py-6 text-dim">
                        Nothing is stuck. Every paid order has been delivered.
                    </p>
                ) : (
                    <ul className="mt-4 space-y-3">
                        {attention.slice(0, 6).map(({ order, reason }) => (
                            <li key={order.id}>
                                <Link
                                    to={`/orders/${order.id}`}
                                    className="flex items-center justify-between gap-4 rounded-2xl border border-danger/40 bg-danger/5 px-5 py-4 transition-colors hover:bg-danger/10"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold">{order.orderNumber}</p>
                                        <p className="truncate text-sm text-dim">{reason}</p>
                                    </div>
                                    <span className="shrink-0 font-display text-[15px] font-semibold">{money(order.total, order.currency)}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section aria-labelledby="recent-heading">
                <div className="flex items-baseline justify-between">
                    <h2 id="recent-heading" className="font-display text-lg font-semibold">
                        Latest orders
                    </h2>
                    <Link to="/admin/orders" className="text-sm font-semibold text-accent-text underline underline-offset-4">
                        See all
                    </Link>
                </div>
                {orders.length === 0 ? (
                    <p className="mt-4 rounded-2xl border border-dashed border-line px-5 py-10 text-center text-dim">No orders yet.</p>
                ) : (
                    <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                        {orders.slice(0, 8).map((o) => (
                            <li key={o.id}>
                                <Link to={`/orders/${o.id}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-raised">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold">{o.items[0]?.productName ?? o.orderNumber}</p>
                                        <p className="truncate text-sm text-dim">
                                            {o.orderNumber} — {dateTime(o.createdAt)}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="font-display text-[15px] font-semibold">{money(o.total, o.currency)}</span>
                                        <StatusPill stage={stageOf(o)} />
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
