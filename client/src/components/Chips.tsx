interface Option<T extends string> {
    value: T;
    label: string;
    count?: number;
}

interface Props<T extends string> {
    options: Option<T>[];
    value: T;
    onChange: (value: T) => void;
}

export default function Chips<T extends string>({ options, value, onChange }: Props<T>) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((o) => {
                const active = o.value === value;
                return (
                    <button
                        key={o.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onChange(o.value)}
                        className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                            active ? "border-accent bg-accent text-on-accent" : "border-line text-dim hover:text-ink"
                        }`}
                    >
                        {o.label}
                        {o.count !== undefined && (
                            <span className={`ml-1.5 tabular-nums ${active ? "opacity-70" : "opacity-60"}`}>{o.count}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
