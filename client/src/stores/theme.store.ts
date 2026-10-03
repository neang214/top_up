import { create } from "zustand";

export type Theme = "light" | "dark";

const KEY = "topup-theme";

const initialTheme = (): Theme => {
    try {
        const saved = localStorage.getItem(KEY);
        if (saved === "light" || saved === "dark") return saved;
    } catch {
        /* storage unavailable */
    }
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
};

const apply = (theme: Theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
        localStorage.setItem(KEY, theme);
    } catch {
        /* storage unavailable */
    }
};

interface ThemeState {
    theme: Theme;
    toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
    theme: initialTheme(),
    toggle: () => {
        const next: Theme = get().theme === "dark" ? "light" : "dark";
        apply(next);
        set({ theme: next });
    },
}));
