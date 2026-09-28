import { create } from "zustand";
import { api } from "./api";

export interface Product {
    id: string;
    gameId: string;
    supplierPackageId: string;
    name: string;
    amount: number;
    price: number;
    isActive: boolean;
}

export type CreateProductPayload = Omit<Product, "id" | "isActive">;
export type UpdateProductPayload = Pick<Product, "id" | "name" | "amount" | "price">;
export type ProductStatusPayload = Pick<Product, "id" | "isActive">;

interface ProductState {
    products: Product[] | null;
    isLoading: boolean;
    getProductsByGame: (gameId: string) => Promise<void>;
    createProduct: (data: CreateProductPayload) => Promise<void>;
    updateProduct: (data: UpdateProductPayload) => Promise<void>;
    toggleProduct: (data: ProductStatusPayload) => Promise<void>;
}

export const useProductService = create<ProductState>((set) => ({
    products: null,
    isLoading: false,

    getProductsByGame: async (gameId: string) => {
        set({ isLoading: true });
        try {
            const res = await api.get<Product[]>(`/games/${gameId}/products`);
            set({ products: res.data, isLoading: false });
        } catch (error) {
            set({ products: null, isLoading: false });
        }
    },

    createProduct: async (data: CreateProductPayload) => {
        set({ isLoading: true });
        try {
            const res = await api.post<{ message: string; product: Product }>(
                `/games/${data.gameId}/products`,
                data
            );
            const newProduct = res.data.product;

            set((state) => ({
                products: state.products ? [...state.products, newProduct] : [newProduct],
                isLoading: false,
            }));
        } catch (error) {
            set({ isLoading: false });
        }
    },

    updateProduct: async (data: UpdateProductPayload) => {
        set({ isLoading: true });
        try {
            const res = await api.put<{ message: string; product: Product }>(
                `/products/${data.id}`,
                {
                    name: data.name,
                    amount: data.amount,
                    price: data.price,
                }
            );
            const updatedProduct = res.data.product;

            set((state) => ({
                products: state.products?.map((p) => (p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p)) ?? null,
                isLoading: false,
            }));
        } catch (error) {
            set({ isLoading: false });
        }
    },

    toggleProduct: async (data: ProductStatusPayload) => {
        set({ isLoading: true });
        try {
            const res = await api.patch<{ message: string; product: Product }>(
                `/products/${data.id}/status`,
                {
                    isActive: data.isActive,
                }
            );
            const updatedProduct = res.data.product;

            set((state) => ({
                products: state.products?.map((p) => (p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p)) ?? null,
                isLoading: false,
            }));
        } catch (error) {
            set({ isLoading: false });
        }
    },
}));