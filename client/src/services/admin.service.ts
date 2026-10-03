import { api } from "./api";
import type { Game } from "./game.service";
import type { Order, TopUp } from "./order.service";

/* Admin-only calls. Unlike the shop services, these throw on failure
   so the admin pages can show the server's message. */

export interface AdminTopUp extends TopUp {
    order: Omit<Order, "items" | "topUp" | "payment">;
}

export interface GameInput {
    name: string;
    slug: string;
    imageUrl: string | null;
}

/** A pack as returned by the public list (active packs only). */
export interface Pack {
    id: string;
    name: string;
    amount: number;
    price: string | number;
    imageUrl: string | null;
}

export interface PackInput {
    name: string;
    amount: number;
    price: number;
}

export const getAllOrders = async () => (await api.get<Order[]>("/orders")).data;

export const getAllTopUps = async () => (await api.get<AdminTopUp[]>("/topups")).data;

export const getAllGames = async () => (await api.get<Game[]>("/games")).data;

export const createGame = async (input: GameInput) => (await api.post<{ game: Game }>("/games", input)).data.game;

export const updateGame = async (id: string, input: GameInput) =>
    (await api.put<{ game: Game }>(`/games/${id}`, input)).data.game;

export const setGameActive = async (id: string, isActive: boolean) =>
    (await api.patch<{ game: Game }>(`/games/${id}/status`, { isActive })).data.game;

export const getPacks = async (gameId: string) => (await api.get<Pack[]>(`/games/${gameId}/products`)).data;

export const createPack = async (gameId: string, input: PackInput) =>
    (await api.post<{ product: Pack }>(`/games/${gameId}/products`, input)).data.product;

export const hidePack = async (packId: string) => {
    await api.patch(`/products/${packId}/status`, { isActive: false });
};
