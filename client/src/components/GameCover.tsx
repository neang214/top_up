import { useState } from "react";

/** Deterministic hue from the game name, used when a game has no working image. */
const hueFor = (text: string) => {
    let h = 0;
    for (const c of text) h = (h * 31 + c.charCodeAt(0)) % 360;
    return h;
};

const initials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]!.toUpperCase())
        .join("");

interface Props {
    name: string;
    imageUrl: string | null;
    className?: string;
}

export default function GameCover({ name, imageUrl, className = "" }: Props) {
    const [failed, setFailed] = useState(false);

    if (imageUrl && !failed) {
        return (
            <img
                src={imageUrl}
                alt=""
                loading="lazy"
                onError={() => setFailed(true)}
                className={`object-cover ${className}`}
            />
        );
    }

    const hue = hueFor(name);
    return (
        <div
            aria-hidden
            className={`@container grid place-items-center overflow-hidden font-display font-bold text-white/90 ${className}`}
            style={{
                background: `linear-gradient(145deg, hsl(${hue} 65% 42%), hsl(${(hue + 50) % 360} 70% 24%))`,
            }}
        >
            <span className="text-[30cqw] leading-none tracking-tight">{initials(name)}</span>
        </div>
    );
}
