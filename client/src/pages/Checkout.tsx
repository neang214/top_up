import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DownloadIcon } from "../components/icons";
import { money } from "../lib/format";
import { btn } from "../lib/ui";
import { useOrderService } from "../services/order.service";
import { usePaymentService, type KHQRResponse } from "../services/payment.service";

const QR_LIFETIME_MS = 10 * 60 * 1000;
const POLL_MS = 3000;

/* React StrictMode runs effects twice in development. Sharing one in-flight request
   per order keeps the backend from being asked to create the same payment twice. */
const inflight = new Map<string, Promise<KHQRResponse | null>>();
const requestQr = (orderId: string) => {
    let p = inflight.get(orderId);
    if (!p) {
        p = usePaymentService
            .getState()
            .generateKHQR(orderId)
            .finally(() => inflight.delete(orderId));
        inflight.set(orderId, p);
    }
    return p;
};

const isPhone = () =>
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));

const clock = (ms: number) => {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const m = String(Math.floor(total / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${m}:${s}`;
};

type Phase = "loading" | "ready" | "missing" | "error";

export default function Checkout() {
    const { orderId = "" } = useParams();
    const navigate = useNavigate();

    const order = useOrderService((s) => s.currentOrder);
    const getOrder = useOrderService((s) => s.getOrder);
    const qrImage = usePaymentService((s) => s.qrImage);
    const md5 = usePaymentService((s) => s.md5);
    const verifyPayment = usePaymentService((s) => s.verifyPayment);
    const resetPayment = usePaymentService((s) => s.resetPayment);

    const [phase, setPhase] = useState<Phase>("loading");
    const [now, setNow] = useState(() => Date.now());
    const [onPhone] = useState(isPhone);
    const checking = useRef(false);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setPhase("loading");
            await getOrder(orderId);
            if (cancelled) return;

            const current = useOrderService.getState().currentOrder;
            if (!current || current.id !== orderId) return setPhase("missing");
            if (current.status !== "PENDING") return navigate(`/orders/${orderId}`, { replace: true });

            const qr = await requestQr(orderId);
            if (cancelled) return;
            setPhase(qr ? "ready" : "error");
        })();

        return () => {
            cancelled = true;
            resetPayment();
        };
    }, [orderId, getOrder, navigate, resetPayment]);

    const current = order && order.id === orderId ? order : null;
    const expiresAt = current ? new Date(current.createdAt).getTime() + QR_LIFETIME_MS : 0;
    const remaining = Math.max(0, expiresAt - now);
    const expired = phase === "ready" && remaining === 0;

    useEffect(() => {
        if (phase !== "ready" || expired) return;
        const tick = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(tick);
    }, [phase, expired]);

    useEffect(() => {
        if (phase !== "ready" || expired || !md5) return;

        const check = async () => {
            if (checking.current) return;
            checking.current = true;
            const status = await verifyPayment(orderId, md5);
            checking.current = false;
            if (status === "COMPLETED") navigate(`/orders/${orderId}`, { replace: true });
        };

        // When the customer comes back from their bank app, check right away instead of waiting.
        const onVisible = () => {
            if (document.visibilityState !== "visible") return;
            setNow(Date.now());
            check();
        };

        const poll = setInterval(check, POLL_MS);
        document.addEventListener("visibilitychange", onVisible);

        return () => {
            clearInterval(poll);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [phase, expired, md5, orderId, verifyPayment, navigate]);

    if (phase === "missing" || phase === "error") {
        return (
            <div className="mx-auto max-w-md px-4 py-24 text-center">
                <h1 className="font-display text-2xl font-bold">
                    {phase === "missing" ? "We couldn’t find this order." : "We couldn’t create the KHQR code."}
                </h1>
                <p className="mt-3 text-dim">
                    {phase === "missing"
                        ? "Check the link, or start a new top-up."
                        : "Nothing was charged. Please go back and try again."}
                </p>
                <Link to="/" className={`${btn("primary")} mt-8`}>
                    Back to games
                </Link>
            </div>
        );
    }

    const item = current?.items[0];
    const progress = Math.min(100, (remaining / QR_LIFETIME_MS) * 100);

    return (
        <div className="mx-auto max-w-md px-4 py-10">
            <h1 className="text-center font-display text-2xl font-bold tracking-tight">Scan to pay</h1>
            <p className="mt-2 text-center text-sm text-dim">
                {onPhone
                    ? "Save the QR image, then scan it from your banking app."
                    : "Open your banking app, choose Scan, and point it at the code."}
            </p>

            <div className="mt-8 overflow-hidden rounded-3xl border border-line bg-surface">
                <div className="flex items-center justify-between bg-khqr px-6 py-4 text-white">
                    <span className="font-display text-lg font-bold tracking-tight">KHQR</span>
                    <span className="text-sm font-medium text-white/85">{current?.orderNumber ?? ""}</span>
                </div>

                <div className="px-6 pb-6 pt-7">
                    <p className="text-center text-sm text-dim">Amount to pay</p>
                    <p className="mt-1 text-center font-display text-4xl font-bold tracking-tight">
                        {current ? money(current.total, current.currency) : "—"}
                    </p>

                    <div className="relative mx-auto mt-6 aspect-square w-full max-w-64 rounded-2xl bg-white p-3">
                        {phase === "ready" && qrImage ? (
                            <img
                                src={qrImage}
                                alt="KHQR payment code"
                                className={`size-full transition-opacity ${expired ? "opacity-15" : ""}`}
                            />
                        ) : (
                            <div className="size-full animate-pulse rounded-lg bg-neutral-200" />
                        )}
                        {expired && (
                            <div className="absolute inset-0 grid place-items-center p-6 text-center">
                                <p className="font-semibold text-neutral-900">This code has expired.</p>
                            </div>
                        )}
                    </div>

                    {phase === "ready" && qrImage && !expired && (
                        <div className="mt-4 flex justify-center">
                            <a
                                href={qrImage}
                                download={`khqr-${current?.orderNumber ?? "order"}.png`}
                                className={btn("ghost", "sm")}
                            >
                                <DownloadIcon width={16} height={16} />
                                Save QR image
                            </a>
                        </div>
                    )}

                    {onPhone && phase === "ready" && !expired && (
                        <p className="mt-4 text-center text-sm text-dim">
                            Paying from this phone? Tap <span className="font-semibold text-ink">Save QR image</span>, open your banking
                            app, choose Scan, then pick the image from your gallery.
                        </p>
                    )}

                    {phase === "ready" && (
                        <div className="mt-6">
                            <div className="flex items-baseline justify-between text-sm">
                                <span className="text-dim">Code expires in</span>
                                <span className="font-display font-semibold tabular-nums">{clock(remaining)}</span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-raised">
                                <div
                                    className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-linear"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative border-t border-dashed border-line">
                    <span className="absolute -left-3 -top-3 size-6 rounded-full border border-line bg-canvas" aria-hidden />
                    <span className="absolute -right-3 -top-3 size-6 rounded-full border border-line bg-canvas" aria-hidden />
                    <dl className="space-y-3 px-6 py-6 text-sm">
                        <div className="flex justify-between gap-4">
                            <dt className="text-dim">Pack</dt>
                            <dd className="text-right font-semibold">{item?.productName ?? "—"}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-dim">Player ID</dt>
                            <dd className="text-right font-semibold">{current?.topUp?.playerId ?? "—"}</dd>
                        </div>
                        {current?.topUp?.zoneId && (
                            <div className="flex justify-between gap-4">
                                <dt className="text-dim">Zone ID</dt>
                                <dd className="text-right font-semibold">{current.topUp.zoneId}</dd>
                            </div>
                        )}
                    </dl>
                </div>
            </div>

            {expired ? (
                <div className="mt-6 text-center">
                    <p className="text-sm text-dim">Start a new top-up to get a fresh code.</p>
                    <Link to="/" className={`${btn("primary")} mt-4`}>
                        Start a new top-up
                    </Link>
                </div>
            ) : (
                phase === "ready" && (
                    <p className="mt-6 flex items-center justify-center gap-2 text-sm text-dim" aria-live="polite">
                        <span className="relative flex size-2.5">
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
                            <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
                        </span>
                        Waiting for your payment. Keep this page open.
                    </p>
                )
            )}
        </div>
    );
}
