import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckIcon, XIcon } from "../components/icons";
import StatusPill, { stageOf } from "../components/StatusPill";
import { dateTime, money } from "../lib/format";
import { btn } from "../lib/ui";
import { useOrderService, type Order as OrderType } from "../services/order.service";

type StepState = "done" | "current" | "todo" | "failed";

const stepsFor = (order: OrderType): { title: string; time: string | null; state: StepState }[] => {
    const failed = order.status === "FAILED" || order.topUp?.status === "FAILED";
    const cancelled = order.status === "CANCELLED";
    const paid = order.status === "PAID" || order.status === "COMPLETED" || failed;

    return [
        { title: "Order placed", time: order.createdAt, state: "done" },
        {
            title: "Payment received",
            time: order.paidAt,
            state: paid ? "done" : cancelled ? "todo" : "current",
        },
        {
            title: "Top-up delivered",
            time: order.completedAt,
            state: order.status === "COMPLETED" ? "done" : failed ? "failed" : paid ? "current" : "todo",
        },
    ];
};

const marker: Record<StepState, string> = {
    done: "bg-success text-white",
    current: "border-2 border-accent bg-accent/15",
    todo: "border-2 border-line",
    failed: "bg-danger text-white",
};

export default function Order() {
    const { orderId = "" } = useParams();
    const order = useOrderService((s) => s.currentOrder);
    const getOrder = useOrderService((s) => s.getOrder);
    const isLoading = useOrderService((s) => s.isLoading);

    useEffect(() => {
        getOrder(orderId);
    }, [orderId, getOrder]);

    const current = order && order.id === orderId ? order : null;
    const inFlight = current?.status === "PAID";

    useEffect(() => {
        if (!inFlight) return;
        const poll = setInterval(() => getOrder(orderId), 4000);
        return () => clearInterval(poll);
    }, [inFlight, orderId, getOrder]);

    if (!current) {
        return isLoading ? (
            <div className="mx-auto max-w-xl px-4 py-14">
                <div className="h-10 w-2/3 animate-pulse rounded bg-raised" />
                <div className="mt-8 h-64 animate-pulse rounded-3xl bg-raised" />
            </div>
        ) : (
            <div className="mx-auto max-w-md px-4 py-24 text-center">
                <h1 className="font-display text-2xl font-bold">We couldn’t find this order.</h1>
                <p className="mt-3 text-dim">Check the link, or start a new top-up.</p>
                <Link to="/" className={`${btn("primary")} mt-8`}>
                    Back to games
                </Link>
            </div>
        );
    }

    const stage = stageOf(current);
    const item = current.items[0];
    const steps = stepsFor(current);
    const failed = stage.tone === "bad" && current.status !== "CANCELLED";

    const headline =
        current.status === "COMPLETED"
            ? "Your top-up is delivered."
            : failed
              ? "Something went wrong with this top-up."
              : current.status === "CANCELLED"
                ? "This order was cancelled."
                : current.status === "PAID"
                  ? "Payment received. Delivering now."
                  : "This order is waiting for payment.";

    return (
        <div className="mx-auto max-w-xl px-4 py-12">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm text-dim">{current.orderNumber}</p>
                    <h1 className="mt-1 font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                        {headline}
                    </h1>
                </div>
                <StatusPill stage={stage} />
            </div>

            {failed && (
                <p className="mt-4 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm">
                    If you were charged, keep your order number ({current.orderNumber}) and contact support. We will fix
                    it or refund you.
                </p>
            )}

            <ol className="mt-10">
                {steps.map((s, i) => (
                    <li key={s.title} className="relative flex gap-4 pb-8 last:pb-0">
                        {i < steps.length - 1 && (
                            <span className="absolute left-[13px] top-8 h-[calc(100%-2rem)] w-0.5 bg-line" aria-hidden />
                        )}
                        <span className={`relative grid size-7 shrink-0 place-items-center rounded-full ${marker[s.state]}`}>
                            {s.state === "done" && <CheckIcon width={14} height={14} />}
                            {s.state === "failed" && <XIcon width={14} height={14} />}
                            {s.state === "current" && (
                                <span className="size-2.5 animate-pulse rounded-full bg-accent" />
                            )}
                        </span>
                        <div className="pt-0.5">
                            <p className={`font-semibold ${s.state === "todo" ? "text-dim" : ""}`}>{s.title}</p>
                            {s.time && <p className="text-sm text-dim">{dateTime(s.time)}</p>}
                        </div>
                    </li>
                ))}
            </ol>

            <div className="mt-10 rounded-3xl border border-line bg-surface p-6">
                <dl className="space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                        <dt className="text-dim">Pack</dt>
                        <dd className="text-right font-semibold">{item?.productName ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                        <dt className="text-dim">Player ID</dt>
                        <dd className="text-right font-semibold">{current.topUp?.playerId ?? "—"}</dd>
                    </div>
                    {current.topUp?.zoneId && (
                        <div className="flex justify-between gap-4">
                            <dt className="text-dim">Zone ID</dt>
                            <dd className="text-right font-semibold">{current.topUp.zoneId}</dd>
                        </div>
                    )}
                </dl>
                <div className="my-5 border-t border-dashed border-line" />
                <div className="flex items-baseline justify-between">
                    <span className="text-dim">Total</span>
                    <span className="font-display text-xl font-bold">{money(current.total, current.currency)}</span>
                </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
                {current.status === "PENDING" && (
                    <Link to={`/checkout/${current.id}`} className={btn("primary")}>
                        Continue to payment
                    </Link>
                )}
                <Link to="/" className={btn(current.status === "PENDING" ? "ghost" : "primary")}>
                    Top up again
                </Link>
            </div>
        </div>
    );
}
