import { useEffect } from "react";
import { Link } from "react-router-dom";
import StatusPill, { stageOf } from "../components/StatusPill";
import { dateTime, money } from "../lib/format";
import { btn } from "../lib/ui";
import { useOrderService } from "../services/order.service";

export default function MyOrders() {
    const orders = useOrderService((s) => s.orders);
    const isLoading = useOrderService((s) => s.isLoading);
    const getMyOrders = useOrderService((s) => s.getMyOrders);

    useEffect(() => {
        getMyOrders();
    }, [getMyOrders]);

    return (
        <div className="mx-auto max-w-3xl px-4 py-12">
            <h1 className="font-display text-3xl font-bold tracking-tight">My orders</h1>

            <div className="mt-8">
                {orders === null && isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-20 animate-pulse rounded-2xl bg-raised" />
                        ))}
                    </div>
                ) : !orders || orders.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-line px-6 py-16 text-center">
                        <p className="font-semibold">You haven’t made a top-up yet.</p>
                        <p className="mt-1 text-sm text-dim">Pick a game and your first order will show up here.</p>
                        <Link to="/" className={`${btn("primary")} mt-6`}>
                            Browse games
                        </Link>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {orders.map((o) => (
                            <li key={o.id}>
                                <Link
                                    to={o.status === "PENDING" ? `/checkout/${o.id}` : `/orders/${o.id}`}
                                    className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-dim/60"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold">{o.items[0]?.productName ?? o.orderNumber}</p>
                                        <p className="mt-0.5 truncate text-sm text-dim">
                                            {o.orderNumber} — {dateTime(o.createdAt)}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="font-display text-[15px] font-semibold">
                                            {money(o.total, o.currency)}
                                        </span>
                                        <StatusPill stage={stageOf(o)} />
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
