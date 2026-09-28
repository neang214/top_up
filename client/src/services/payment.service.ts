import { create } from "zustand";
import { api } from "./api";

export const PaymentProvider = {
    BAKONG: "BAKONG",
} as const;

export type PaymentProvider = (typeof PaymentProvider)[keyof typeof PaymentProvider];

export const PaymentStatus = {
    PENDING: "PENDING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    EXPIRED: "EXPIRED",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export interface KHQRResponse {
    message: string;
    md5: string;
    qrImage: string;
}

export interface VerifyPaymentResponse {
    message: string;
    status: PaymentStatus;
}

interface PaymentState {
    md5: string | null;
    qrImage: string | null;
    status: PaymentStatus | null;
    isLoading: boolean;
    generateKHQR: (orderId: string) => Promise<KHQRResponse | null>;
    verifyPayment: (orderId: string, md5: string) => Promise<PaymentStatus | null>;
    resetPayment: () => void;
}

export const usePaymentService = create<PaymentState>((set) => ({
    md5: null,
    qrImage: null,
    status: null,
    isLoading: false,

    generateKHQR: async (orderId: string) => {
        set({ isLoading: true });
        try {
            const res = await api.post<KHQRResponse>("/payments", { orderId });
            const data = res.data;

            set({
                md5: data.md5,
                qrImage: data.qrImage,
                status: PaymentStatus.PENDING,
                isLoading: false,
            });

            return data;
        } catch (error) {
            set({ md5: null, qrImage: null, status: null, isLoading: false });
            return null;
        }
    },

    verifyPayment: async (orderId: string, md5: string) => {
        try {
            const res = await api.post<VerifyPaymentResponse>("/payments/verify", {
                orderId,
                md5,
            });
            const paymentStatus = res.data.status;

            set({ status: paymentStatus });
            return paymentStatus;
        } catch (error) {
            return null;
        }
    },

    resetPayment: () => set({ md5: null, qrImage: null, status: null, isLoading: false }),
}));