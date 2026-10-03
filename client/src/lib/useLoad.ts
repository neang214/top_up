import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "./format";

interface State<T> {
    data: T | null;
    error: string | null;
    loading: boolean;
}

/** Runs `load` on mount (and whenever `key` changes) and keeps data, error and loading together. */
export function useLoad<T>(load: () => Promise<T>, key = "") {
    const [state, setState] = useState<State<T>>({ data: null, error: null, loading: true });
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setState((s) => ({ ...s, error: null, loading: true }));

        load()
            .then((data) => {
                if (!cancelled) setState({ data, error: null, loading: false });
            })
            .catch((e) => {
                if (!cancelled)
                    setState({ data: null, error: errorMessage(e, "We couldn’t load this. Please try again."), loading: false });
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, tick]);

    const reload = useCallback(() => setTick((t) => t + 1), []);
    const setData = useCallback((updater: (current: T | null) => T | null) => {
        setState((s) => ({ ...s, data: updater(s.data) }));
    }, []);

    return { ...state, reload, setData };
}
