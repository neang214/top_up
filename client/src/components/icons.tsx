import type { SVGProps } from "react";

const base = (props: SVGProps<SVGSVGElement>) => ({
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
});

export const SunIcon = (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
);

export const MoonIcon = (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
);

export const SearchIcon = (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
    </svg>
);

export const CheckIcon = (p: SVGProps<SVGSVGElement>) => (
    <svg {...base({ strokeWidth: 2.5, ...p })}>
        <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
);

export const XIcon = (p: SVGProps<SVGSVGElement>) => (
    <svg {...base({ strokeWidth: 2.5, ...p })}>
        <path d="M6 6l12 12M18 6 6 18" />
    </svg>
);

export const DownloadIcon = (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
        <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
    </svg>
);

export const Diamond = (p: SVGProps<SVGSVGElement>) => (
    <svg {...base({ fill: "currentColor", stroke: "none", ...p })}>
        <path d="M12 2 21 12l-9 10L3 12Z" />
    </svg>
);
