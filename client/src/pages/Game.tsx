import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import GameCover from "../components/GameCover";
import { CheckIcon } from "../components/icons";
import { money, splitPack } from "../lib/format";
import { btn, inputClass } from "../lib/ui";
import { useGameService } from "../services/game.service";
import { useOrderService } from "../services/order.service";
import { useProductService } from "../services/product.service";

export default function Game() {
    const { slug } = useParams();
    const navigate = useNavigate();

    const games = useGameService((s) => s.games);
    const getGames = useGameService((s) => s.getGames);
    const products = useProductService((s) => s.products);
    const productsLoading = useProductService((s) => s.isLoading);
    const getProductsByGame = useProductService((s) => s.getProductsByGame);
    const createOrder = useOrderService((s) => s.createOrder);

    const [playerId, setPlayerId] = useState("");
    const [zoneId, setZoneId] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (games === null) getGames();
    }, [games, getGames]);

    const game = games?.find((g) => g.slug === slug && g.isActive);
    const gameId = game?.id;

    useEffect(() => {
        setSelectedId(null);
        if (gameId) getProductsByGame(gameId);
    }, [gameId, getProductsByGame]);

    if (games !== null && !game) {
        return (
            <div className="mx-auto max-w-xl px-4 py-24 text-center">
                <h1 className="font-display text-2xl font-bold">We couldn’t find that game.</h1>
                <p className="mt-3 text-dim">It may have been removed or is not available for top-up right now.</p>
                <Link to="/" className={`${btn("primary")} mt-8`}>
                    Browse games
                </Link>
            </div>
        );
    }

    const packs = products ?? [];
    const selected = packs.find((p) => p.id === selectedId) ?? null;
    const canPay = Boolean(selected) && playerId.trim().length > 0 && !submitting;

    const handlePay = async () => {
        if (!selected) return;
        setError(null);
        setSubmitting(true);
        const order = await createOrder({
            productId: selected.id,
            playerId: playerId.trim(),
            zoneId: zoneId.trim() || null,
        });
        setSubmitting(false);

        if (!order) {
            setError("We couldn’t create your order. Check your Player ID and try again.");
            return;
        }
        navigate(`/checkout/${order.id}`);
    };

    const payButton = (
        <button type="button" onClick={handlePay} disabled={!canPay} className={`${btn("primary", "lg")} w-full`}>
            {submitting ? "Creating order…" : "Pay with KHQR"}
        </button>
    );

    return (
        <div className="mx-auto max-w-6xl px-4 pb-32 pt-8 lg:pb-0">
            <Link to="/" className="text-sm font-semibold text-dim hover:text-ink">
                ← All games
            </Link>

            <div className="mt-5 flex items-center gap-4">
                {game ? (
                    <GameCover
                        name={game.name}
                        imageUrl={game.imageUrl}
                        className="size-16 shrink-0 rounded-2xl border border-line sm:size-20"
                    />
                ) : (
                    <div className="size-16 shrink-0 animate-pulse rounded-2xl bg-raised sm:size-20" />
                )}
                <h1 className="font-display text-2xl font-bold tracking-tight sm:text-4xl">
                    {game ? game.name : <span className="inline-block h-8 w-48 animate-pulse rounded bg-raised" />}
                </h1>
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
                <div className="space-y-12">
                    <section aria-labelledby="player-heading">
                        <h2 id="player-heading" className="flex items-center gap-3 font-display text-lg font-semibold">
                            <span className="grid size-7 place-items-center rounded-full bg-accent font-display text-xs font-bold text-on-accent">
                                1
                            </span>
                            Enter your Player ID
                        </h2>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <label className="block">
                                <span className="mb-2 block text-sm font-semibold">Player ID</span>
                                <input
                                    value={playerId}
                                    onChange={(e) => setPlayerId(e.target.value)}
                                    inputMode="numeric"
                                    autoComplete="off"
                                    maxLength={32}
                                    placeholder="e.g. 512345678"
                                    className={inputClass}
                                />
                            </label>
                            <label className="block">
                                <span className="mb-2 block text-sm font-semibold">
                                    Zone ID <span className="font-normal text-dim">(only if your game asks)</span>
                                </span>
                                <input
                                    value={zoneId}
                                    onChange={(e) => setZoneId(e.target.value)}
                                    inputMode="numeric"
                                    autoComplete="off"
                                    maxLength={16}
                                    placeholder="e.g. 2041"
                                    className={inputClass}
                                />
                            </label>
                        </div>
                        <p className="mt-3 text-sm text-dim">
                            Double-check your ID. Top-ups can’t be moved to another account after delivery.
                        </p>
                    </section>

                    <section aria-labelledby="pack-heading">
                        <h2 id="pack-heading" className="flex items-center gap-3 font-display text-lg font-semibold">
                            <span className="grid size-7 place-items-center rounded-full bg-accent font-display text-xs font-bold text-on-accent">
                                2
                            </span>
                            Choose a pack
                        </h2>

                        {productsLoading || products === null ? (
                            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="h-32 animate-pulse rounded-2xl bg-raised" />
                                ))}
                            </div>
                        ) : packs.length === 0 ? (
                            <p className="mt-5 rounded-2xl border border-dashed border-line px-5 py-10 text-center text-dim">
                                No packs are available for this game right now.
                            </p>
                        ) : (
                            <div role="radiogroup" aria-labelledby="pack-heading" className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {packs.map((p) => {
                                    const { big, unit } = splitPack(p.name, p.amount);
                                    const active = p.id === selectedId;
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            role="radio"
                                            aria-checked={active}
                                            onClick={() => setSelectedId(p.id)}
                                            className={`relative flex h-32 flex-col justify-between rounded-2xl border-2 p-4 text-left transition-colors ${
                                                active
                                                    ? "border-accent bg-accent/10"
                                                    : "border-line bg-surface hover:border-dim/60"
                                            }`}
                                        >
                                            {active && (
                                                <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-accent text-on-accent">
                                                    <CheckIcon width={12} height={12} />
                                                </span>
                                            )}
                                            <span>
                                                <span className="block font-display text-3xl font-bold leading-none tracking-tight">
                                                    {big}
                                                </span>
                                                {unit && <span className="mt-1.5 block text-sm font-medium text-dim">{unit}</span>}
                                            </span>
                                            <span className="text-[15px] font-semibold">{money(p.price)}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>

                <aside className="hidden lg:block">
                    <div className="sticky top-24 rounded-3xl border border-line bg-surface p-6">
                        <h2 className="font-display text-lg font-semibold">Your order</h2>
                        <dl className="mt-5 space-y-3 text-sm">
                            <div className="flex justify-between gap-4">
                                <dt className="text-dim">Game</dt>
                                <dd className="text-right font-semibold">{game?.name ?? "—"}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-dim">Pack</dt>
                                <dd className="text-right font-semibold">{selected ? selected.name : "Not chosen yet"}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-dim">Player ID</dt>
                                <dd className="text-right font-semibold">{playerId.trim() || "Not entered yet"}</dd>
                            </div>
                        </dl>
                        <div className="my-5 border-t border-dashed border-line" />
                        <div className="flex items-baseline justify-between">
                            <span className="text-dim">Total</span>
                            <span className="font-display text-2xl font-bold">{selected ? money(selected.price) : "—"}</span>
                        </div>
                        <div className="mt-6">{payButton}</div>
                        {error && (
                            <p role="alert" className="mt-4 text-sm font-medium text-danger">
                                {error}
                            </p>
                        )}
                    </div>
                </aside>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-canvas/95 p-4 backdrop-blur lg:hidden">
                {error && (
                    <p role="alert" className="mb-3 text-sm font-medium text-danger">
                        {error}
                    </p>
                )}
                <div className="mx-auto flex max-w-6xl items-center gap-4">
                    <div className="min-w-0">
                        <p className="truncate text-xs text-dim">{selected ? selected.name : "Choose a pack"}</p>
                        <p className="font-display text-xl font-bold">{selected ? money(selected.price) : "—"}</p>
                    </div>
                    <div className="ml-auto w-44 shrink-0">{payButton}</div>
                </div>
            </div>
        </div>
    );
}
