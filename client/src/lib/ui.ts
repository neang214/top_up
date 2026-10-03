type Variant = "primary" | "ghost" | "subtle";
type Size = "sm" | "md" | "lg";

const base =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold rounded-xl transition-colors " +
    "disabled:opacity-50 disabled:pointer-events-none select-none";

const variants: Record<Variant, string> = {
    primary: "bg-accent text-on-accent hover:bg-accent-hover",
    ghost: "border border-line text-ink hover:bg-raised",
    subtle: "text-dim hover:text-ink hover:bg-raised",
};

const sizes: Record<Size, string> = {
    sm: "h-9 px-3.5 text-sm",
    md: "h-11 px-5 text-[15px]",
    lg: "h-13 px-7 text-base",
};

/** Class string for buttons and links that look like buttons. */
export const btn = (variant: Variant = "primary", size: Size = "md") =>
    `${base} ${variants[variant]} ${sizes[size]}`;

export const inputClass =
    "w-full h-12 rounded-xl border border-line bg-surface px-4 text-[15px] text-ink " +
    "placeholder:text-dim/70 transition-colors focus:border-accent focus:outline-none";
