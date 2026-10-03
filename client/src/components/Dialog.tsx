import { useEffect, useId, useRef, type ReactNode } from "react";
import { XIcon } from "./icons";

interface Props {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

/** Modal built on the native <dialog>, so Escape, focus and the backdrop work out of the box. */
export default function Dialog({ open, onClose, title, children }: Props) {
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        else if (!open && dialog.open) dialog.close();
    }, [open]);

    return (
        <dialog
            ref={ref}
            onClose={onClose}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            aria-labelledby={titleId}
            className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-line bg-surface p-0 text-ink backdrop:bg-black/60"
        >
            {open && (
                <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                        <h2 id={titleId} className="font-display text-lg font-semibold">
                            {title}
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="grid size-9 shrink-0 place-items-center rounded-lg text-dim transition-colors hover:bg-raised hover:text-ink"
                        >
                            <XIcon width={18} height={18} />
                        </button>
                    </div>
                    <div className="mt-5">{children}</div>
                </div>
            )}
        </dialog>
    );
}
