import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import Dialog from "../../components/Dialog";
import { errorMessage, money } from "../../lib/format";
import { btn, inputClass } from "../../lib/ui";
import { useLoad } from "../../lib/useLoad";
import { createPack, getAllGames, getPacks, hidePack, type Pack } from "../../services/admin.service";

function PackForm({ gameId, onSaved, onCancel }: { gameId: string; onSaved: (pack: Pack) => void; onCancel: () => void }) {
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [price, setPrice] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        const amountNum = Number(amount);
        const priceNum = Number(price);
        if (!Number.isInteger(amountNum) || amountNum <= 0) {
            setError("The amount must be a whole number greater than 0.");
            return;
        }
        if (!Number.isFinite(priceNum) || priceNum <= 0) {
            setError("The price must be greater than 0.");
            return;
        }

        setSaving(true);
        try {
            onSaved(await createPack(gameId, { name: name.trim(), amount: amountNum, price: priceNum }));
        } catch (err) {
            setError(errorMessage(err, "We couldn’t add this pack. Please try again."));
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <label className="block">
                <span className="mb-2 block text-sm font-semibold">Pack name</span>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={60}
                    placeholder="e.g. 660 UC"
                    className={inputClass}
                />
                <span className="mt-1.5 block text-xs text-dim">Include the amount and unit, like “660 UC” or “86 Diamonds”.</span>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Amount</span>
                    <input
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        inputMode="numeric"
                        placeholder="e.g. 660"
                        className={inputClass}
                    />
                </label>
                <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Price (USD)</span>
                    <input
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                        inputMode="decimal"
                        placeholder="e.g. 9.99"
                        className={inputClass}
                    />
                </label>
            </div>

            {error && (
                <p role="alert" className="text-sm font-medium text-danger">
                    {error}
                </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onCancel} className={btn("ghost")}>
                    Cancel
                </button>
                <button type="submit" disabled={saving} className={btn("primary")}>
                    {saving ? "Adding…" : "Add pack"}
                </button>
            </div>
        </form>
    );
}

export default function Packs() {
    const { gameId = "" } = useParams();
    const games = useLoad(getAllGames);
    const packs = useLoad(() => getPacks(gameId), gameId);

    const [adding, setAdding] = useState(false);
    const [hiding, setHiding] = useState<Pack | null>(null);
    const [hideError, setHideError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const game = games.data?.find((g) => g.id === gameId);

    const confirmHide = async () => {
        if (!hiding) return;
        setBusy(true);
        setHideError(null);
        try {
            await hidePack(hiding.id);
            const id = hiding.id;
            packs.setData((list) => list?.filter((p) => p.id !== id) ?? null);
            setHiding(null);
        } catch (err) {
            setHideError(errorMessage(err, "We couldn’t hide this pack. Please try again."));
        } finally {
            setBusy(false);
        }
    };

    if (games.loading && !games.data) return <div className="h-96 animate-pulse rounded-3xl bg-raised" />;

    if (!games.loading && games.data && !game) {
        return (
            <div className="rounded-3xl border border-dashed border-line px-6 py-14 text-center">
                <p className="font-semibold">We couldn’t find that game.</p>
                <Link to="/admin/games" className={`${btn("primary")} mt-5`}>
                    Back to games
                </Link>
            </div>
        );
    }

    return (
        <div>
            <Link to="/admin/games" className="text-sm font-semibold text-dim hover:text-ink">
                ← All games
            </Link>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <h1 className="font-display text-2xl font-bold tracking-tight">{game?.name ?? "Packs"}</h1>
                <button type="button" onClick={() => setAdding(true)} className={btn("primary")}>
                    Add pack
                </button>
            </div>
            <p className="mt-2 text-sm text-dim">
                Only packs customers can see are listed here. Hiding a pack can’t be undone from this page yet.
            </p>

            {packs.loading && !packs.data ? (
                <div className="mt-6 h-64 animate-pulse rounded-2xl bg-raised" />
            ) : packs.error || !packs.data ? (
                <div className="mt-6 rounded-3xl border border-dashed border-line px-6 py-14 text-center">
                    <p className="font-semibold">{packs.error ?? "No data."}</p>
                    <button
                        type="button"
                        onClick={packs.reload}
                        className="mt-3 text-sm font-semibold text-accent-text underline underline-offset-4"
                    >
                        Try again
                    </button>
                </div>
            ) : packs.data.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-dashed border-line px-6 py-16 text-center">
                    <p className="font-semibold">No packs yet.</p>
                    <p className="mt-1 text-sm text-dim">Add a pack so customers can buy top-ups for this game.</p>
                </div>
            ) : (
                <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                    {packs.data.map((p) => (
                        <li key={p.id} className="flex items-center gap-4 px-5 py-4">
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold">{p.name}</p>
                                <p className="truncate text-sm text-dim">Amount: {p.amount.toLocaleString("en-US")}</p>
                            </div>
                            <span className="font-display text-[15px] font-semibold">{money(p.price)}</span>
                            <button type="button" onClick={() => setHiding(p)} className={btn("ghost", "sm")}>
                                Hide
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <Dialog open={adding} onClose={() => setAdding(false)} title="Add a pack">
                <PackForm
                    gameId={gameId}
                    onCancel={() => setAdding(false)}
                    onSaved={(pack) => {
                        packs.setData((list) => [...(list ?? []), pack]);
                        setAdding(false);
                    }}
                />
            </Dialog>

            <Dialog
                open={hiding !== null}
                onClose={() => {
                    setHiding(null);
                    setHideError(null);
                }}
                title="Hide this pack?"
            >
                <p className="text-dim">
                    Customers will no longer see <span className="font-semibold text-ink">{hiding?.name}</span>. Past orders are not
                    affected. You can’t bring it back from this page yet.
                </p>
                {hideError && (
                    <p role="alert" className="mt-4 text-sm font-medium text-danger">
                        {hideError}
                    </p>
                )}
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            setHiding(null);
                            setHideError(null);
                        }}
                        className={btn("ghost")}
                    >
                        Keep it
                    </button>
                    <button
                        type="button"
                        onClick={confirmHide}
                        disabled={busy}
                        className={`${btn("primary")} !bg-danger !text-white`}
                    >
                        {busy ? "Hiding…" : "Hide pack"}
                    </button>
                </div>
            </Dialog>
        </div>
    );
}
