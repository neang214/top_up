interface Props {
    checked: boolean;
    onChange: (next: boolean) => void;
    label: string;
    disabled?: boolean;
}

export default function Switch({ checked, onChange, label, disabled }: Props) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors disabled:opacity-50 ${
                checked ? "border-accent bg-accent" : "border-line bg-raised"
            }`}
        >
            <span
                className={`absolute left-[3px] top-[2px] size-[22px] rounded-full transition-transform ${
                    checked ? "translate-x-5 bg-on-accent" : "translate-x-0 bg-dim"
                }`}
            />
        </button>
    );
}
