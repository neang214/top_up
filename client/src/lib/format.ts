import axios from "axios";

export const money = (value: number | string, currency = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(value));

export const dateTime = (iso: string) =>
    new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

export const errorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as { message?: string; messsage?: string } | undefined;
        return data?.message ?? data?.messsage ?? fallback;
    }
    return fallback;
};

/** "60 UC" with amount 60 -> { big: "60", unit: "UC" } */
export const splitPack = (name: string, amount: number) => {
    const unit = name.replace(String(amount), "").replace(/\s+/g, " ").trim();
    return { big: amount.toLocaleString("en-US"), unit };
};
