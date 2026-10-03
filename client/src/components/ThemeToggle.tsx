import { useThemeStore } from "../stores/theme.store";
import { MoonIcon, SunIcon } from "./icons";

export default function ThemeToggle() {
    const theme = useThemeStore((s) => s.theme);
    const toggle = useThemeStore((s) => s.toggle);
    const isDark = theme === "dark";

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={isDark ? "Switch to white theme" : "Switch to dark theme"}
            title={isDark ? "Switch to white theme" : "Switch to dark theme"}
            className="grid size-10 place-items-center rounded-xl border border-line text-ink transition-colors hover:bg-raised"
        >
            {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
    );
}
