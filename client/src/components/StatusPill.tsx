import type { Order, TopUpStatus } from "../services/order.service";

export interface Stage {
    label: string;
    tone: "wait" | "work" | "good" | "bad";
}

/** One plain-language stage for an order, combining the order and top-up status. */
export const stageOf = (order: Pick<Order, "status" | "topUp">): Stage => {
    if (order.status === "COMPLETED") return { label: "Delivered", tone: "good" };
    if (order.status === "CANCELLED") return { label: "Cancelled", tone: "bad" };
    if (order.status === "FAILED" || order.topUp?.status === "FAILED") return { label: "Failed", tone: "bad" };
    if (order.status === "PAID") return { label: "Delivering", tone: "work" };
    return { label: "Waiting for payment", tone: "wait" };
};

/** Stage for a top-up on its own (admin top-up list). */
export const topUpStage = (status: TopUpStatus): Stage => {
    if (status === "COMPLETED") return { label: "Delivered", tone: "good" };
    if (status === "FAILED") return { label: "Failed", tone: "bad" };
    if (status === "PROCESSING") return { label: "Processing", tone: "work" };
    return { label: "Pending", tone: "wait" };
};

const tones: Record<Stage["tone"], string> = {
    wait: "text-dim border-line",
    work: "text-accent-text border-accent/50 bg-accent/10",
    good: "text-success border-success/40 bg-success/10",
    bad: "text-danger border-danger/40 bg-danger/10",
};

export default function StatusPill({ stage }: { stage: Stage }) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tones[stage.tone]}`}
        >
            {stage.label}
        </span>
    );
}
