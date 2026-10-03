import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import Dialog from "../../components/Dialog";
import GameCover from "../../components/GameCover";
import Switch from "../../components/Switch";
import { errorMessage } from "../../lib/format";
import { btn, inputClass } from "../../lib/ui";
import { useLoad } from "../../lib/useLoad";
import { createGame, getAllGames, setGameActive, updateGame } from "../../services/admin.service";
import type { Game } from "../../services/game.service";

const slugify = (text: string) =>
    text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

interface FormProps {
    game: Game | null;
    onSaved: (game: Game) => void;
    onCancel: () => void;
}

function GameForm({ game, onSaved, onCancel }: FormProps) {
    const [name, setName] = useState(game?.name ?? "");
    const [slug, setSlug] = useState(game?.slug ?? "");
    const [slugTouched, setSlugTouched] = useState(Boolean(game));
    const [imageUrl, setImageUrl] = useState(game?.imageUrl ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        const cleanSlug = slug.trim();
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)) {
            setError("The web address can only use lowercase letters, numbers and dashes.");
            return;
        }

        setSaving(true);
        try {
            const input = { name: name.trim(), slug: cleanSlug, imageUrl: imageUrl.trim() || null };
            const saved = game ? await updateGame(game.id, input) : await createGame(input);
            onSaved(saved);
        } catch (err) {
            setError(errorMessage(err, "We couldn’t save this game. Please try again."));
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <label className="block">
                <span className="mb-2 block text-sm font-semibold">Game name</span>
                <input
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        if (!slugTouched) setSlug(slugify(e.target.value));
                    }}
                    required
                    maxLength={80}
                    placeholder="e.g. PUBG Mobile"
                    className={inputClass}
                />
            </label>
            <label className="block">
                <span className="mb-2 block text-sm font-semibold">Web address</span>
                <input
                    value={slug}
                    onChange={(e) => {
                        setSlug(e.target.value);
                        setSlugTouched(true);
                    }}
                    required
                    maxLength={80}
                    placeholder="e.g. pubg-mobile"
                    className={inputClass}
                />
                <span className="mt-1.5 block text-xs text-dim">Shown in the link: /games/{slug || "…"}</span>
            </label>
            <label className="block">
                <span className="mb-2 block text-sm font-semibold">
                    Cover image link <span className="font-normal text-dim">(optional)</span>
                </span>
                <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://…"
                    className={inputClass}
                />
            </label>

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
                    {saving ? "Saving…" : game ? "Save changes" : "Add game"}
                </button>
            </div>
        </form>
    );
}

export default function Games() {
    const { data: games, error, loading, reload, setData } = useLoad(getAllGames);
    const [editing, setEditing] = useState<Game | "new" | null>(null);
    const [pending, setPending] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const toggle = async (game: Game, next: boolean) => {
        setActionError(null);
        setPending(game.id);
        try {
            const saved = await setGameActive(game.id, next);
            setData((list) => list?.map((g) => (g.id === saved.id ? saved : g)) ?? null);
        } catch (err) {
            setActionError(errorMessage(err, `We couldn’t update ${game.name}. Please try again.`));
        } finally {
            setPending(null);
        }
    };

    const handleSaved = (saved: Game) => {
        setData((list) => {
            const current = list ?? [];
            return current.some((g) => g.id === saved.id)
                ? current.map((g) => (g.id === saved.id ? saved : g))
                : [...current, saved];
        });
        setEditing(null);
    };

    if (loading && !games) return <div className="h-96 animate-pulse rounded-3xl bg-raised" />;

    if (error || !games) {
        return (
            <div className="rounded-3xl border border-dashed border-line px-6 py-14 text-center">
                <p className="font-semibold">{error ?? "No data."}</p>
                <button type="button" onClick={reload} className="mt-3 text-sm font-semibold text-accent-text underline underline-offset-4">
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between gap-4">
                <p className="text-dim">
                    {games.length} {games.length === 1 ? "game" : "games"}. Hidden games don’t show in the shop.
                </p>
                <button type="button" onClick={() => setEditing("new")} className={btn("primary")}>
                    Add game
                </button>
            </div>

            {actionError && (
                <p role="alert" className="mt-4 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm font-medium">
                    {actionError}
                </p>
            )}

            {games.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-dashed border-line px-6 py-16 text-center">
                    <p className="font-semibold">No games yet.</p>
                    <p className="mt-1 text-sm text-dim">Add your first game to start selling top-ups.</p>
                </div>
            ) : (
                <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                    {games.map((g) => (
                        <li key={g.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
                            <GameCover name={g.name} imageUrl={g.imageUrl} className="size-12 shrink-0 rounded-xl" />
                            <div className="min-w-0 flex-1 basis-40">
                                <p className="truncate font-semibold">{g.name}</p>
                                <p className="truncate text-sm text-dim">/games/{g.slug}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="w-14 text-right text-sm text-dim">{g.isActive ? "Visible" : "Hidden"}</span>
                                <Switch
                                    checked={g.isActive}
                                    onChange={(next) => toggle(g, next)}
                                    disabled={pending === g.id}
                                    label={`${g.name} is ${g.isActive ? "visible" : "hidden"} in the shop`}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Link to={`/admin/games/${g.id}/packs`} className={btn("ghost", "sm")}>
                                    Packs
                                </Link>
                                <button type="button" onClick={() => setEditing(g)} className={btn("ghost", "sm")}>
                                    Edit
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <Dialog
                open={editing !== null}
                onClose={() => setEditing(null)}
                title={editing === "new" ? "Add a game" : "Edit game"}
            >
                <GameForm
                    game={editing === "new" ? null : editing}
                    onSaved={handleSaved}
                    onCancel={() => setEditing(null)}
                />
            </Dialog>
        </div>
    );
}
