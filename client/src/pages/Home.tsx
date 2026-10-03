import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GameCover from "../components/GameCover";
import { CheckIcon, SearchIcon } from "../components/icons";
import { inputClass } from "../lib/ui";
import { useGameService } from "../services/game.service";

const steps = [
    { title: "Choose a pack", text: "Pick your game and the amount you want." },
    { title: "Scan the KHQR", text: "Pay from any Bakong-enabled banking app." },
    { title: "Get it in-game", text: "We deliver straight to your Player ID." },
];

export default function Home() {
    const games = useGameService((s) => s.games);
    const isLoading = useGameService((s) => s.isLoading);
    const getGames = useGameService((s) => s.getGames);
    const [query, setQuery] = useState("");

    useEffect(() => {
        getGames();
    }, [getGames]);

    const term = query.trim().toLowerCase();
    const list = (games ?? []).filter((g) => g.isActive && g.name.toLowerCase().includes(term));
    const loading = games === null && isLoading;

    return (
        <>
            <section className="relative overflow-hidden">
                <div className="bg-dots absolute inset-0" aria-hidden />
                <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-14 sm:pt-20">
                    <h1 className="max-w-3xl font-display text-[2.1rem] font-bold leading-[1.1] tracking-tight sm:text-6xl">
                        Top up your game in under a minute.
                    </h1>
                    <p className="mt-5 max-w-xl text-lg text-dim">
                        Pick a game, enter your Player ID, then scan one KHQR code to pay.
                    </p>

                    <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
                        {["No account needed", "Pay with KHQR", "Delivered to your Player ID"].map((t) => (
                            <li key={t} className="flex items-center gap-2">
                                <CheckIcon width={16} height={16} className="text-success" />
                                {t}
                            </li>
                        ))}
                    </ul>

                    <div className="relative mt-9 max-w-md">
                        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dim" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Find a game"
                            aria-label="Find a game"
                            className={`${inputClass} pl-12`}
                        />
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-4" aria-labelledby="games-heading">
                <h2 id="games-heading" className="mb-5 font-display text-xl font-semibold">
                    Choose your game
                </h2>

                {loading ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-raised" />
                        ))}
                    </div>
                ) : list.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-line px-6 py-16 text-center">
                        {term ? (
                            <>
                                <p className="font-semibold">No game matches “{query.trim()}”.</p>
                                <button
                                    type="button"
                                    onClick={() => setQuery("")}
                                    className="mt-3 text-sm font-semibold text-accent-text underline underline-offset-4"
                                >
                                    Clear search
                                </button>
                            </>
                        ) : (
                            <p className="font-semibold">No games are available right now. Please check back soon.</p>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {list.map((game) => (
                            <Link
                                key={game.id}
                                to={`/games/${game.slug}`}
                                className="group relative block aspect-[3/4] overflow-hidden rounded-3xl border border-line bg-surface"
                            >
                                <GameCover
                                    name={game.name}
                                    imageUrl={game.imageUrl}
                                    className="size-full transition-transform duration-300 group-hover:scale-[1.04]"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-4 pt-14">
                                    <p className="font-display text-[15px] font-semibold leading-tight text-white">
                                        {game.name}
                                    </p>
                                    <p className="mt-1 text-xs font-medium text-white/70 transition-colors group-hover:text-[var(--accent-hover)]">
                                        Top up
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            <section className="mx-auto mt-20 max-w-6xl px-4" aria-labelledby="how-heading">
                <h2 id="how-heading" className="mb-6 font-display text-xl font-semibold">
                    How it works
                </h2>
                <ol className="grid gap-4 sm:grid-cols-3">
                    {steps.map((s, i) => (
                        <li key={s.title} className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
                            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent font-display text-sm font-bold text-on-accent">
                                {i + 1}
                            </span>
                            <div>
                                <p className="font-semibold">{s.title}</p>
                                <p className="mt-1 text-sm text-dim">{s.text}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </section>
        </>
    );
}
