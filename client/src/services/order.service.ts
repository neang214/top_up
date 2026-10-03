import { create } from "zustand";
import { api } from "./api";

export const OrderStatus = {
    PENDING: "PENDING",
    PAID: "PAID",
    PROCESSING: "PROCESSING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    CANCELLED: "CANCELLED",
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentStatus = {
    PENDING: "PENDING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    EXPIRED: "EXPIRED",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const TopUpStatus = {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
} as const;

export type TopUpStatus = (typeof TopUpStatus)[keyof typeof TopUpStatus];

export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number | string;
    totalPrice: number | string;
}

export interface TopUp {
    id: string;
    orderId: string;
    playerId: string;
    zoneId: string | null;
    status: TopUpStatus;
}

export interface PaymentSummary {
    status: PaymentStatus;
    paidAt: string | null;
}

export interface Order {
    id: string;
    orderNumber: string;
    userId: string | null;
    total: number | string;
    currency: string;
    status: OrderStatus;
    createdAt: string;
    paidAt: string | null;
    completedAt: string | null;
    items: OrderItem[];
    topUp: TopUp | null;
    payment?: PaymentSummary | null;
}

export interface CreateOrderPayload {
    productId: string;
    playerId: string;
    zoneId?: string | null;
}

interface OrderState {
    orders: Order[] | null;
    currentOrder: Order | null;
    isLoading: boolean;
    createOrder: (payload: CreateOrderPayload) => Promise<Order | null>;
    getOrder: (id: string) => Promise<void>;
    getMyOrders: () => Promise<void>;
    getOrders: () => Promise<void>;
}

export const useOrderService = create<OrderState>((set) => ({
    orders: null,
    currentOrder: null,
    isLoading: false,

    createOrder: async (payload: CreateOrderPayload) => {
        set({ isLoading: true });
        try {
            const res = await api.post<{ message: string; order: Order }>("/orders", payload);
            const createdOrder = res.data.order;

            set((state) => ({
                currentOrder: createdOrder,
                orders: state.orders ? [createdOrder, ...state.orders] : [createdOrder],
                isLoading: false,
            }));

            return createdOrder;
        } catch (error) {
            set({ isLoading: false });
            return null;
        }
    },

    getOrder: async (id: string) => {
        set({ isLoading: true });
        try {
            const res = await api.get<Order>(`/orders/${id}`);
            set({ currentOrder: res.data, isLoading: false });
        } catch (error) {
            set({ currentOrder: null, isLoading: false });
        }
    },

    getMyOrders: async () => {
        set({ isLoading: true });
        try {
            const res = await api.get<Order[]>("/orders/my");
            set({ orders: res.data, isLoading: false });
        } catch (error) {
            set({ orders: null, isLoading: false });
        }
    },

    getOrders: async () => {
        set({ isLoading: true });
        try {
            const res = await api.get<Order[]>("/orders");
            set({ orders: res.data, isLoading: false });
        } catch (error) {
            set({ orders: null, isLoading: false });
        }
    },
}));