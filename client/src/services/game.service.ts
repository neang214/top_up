import { create } from "zustand";
import { api } from "./api";

export interface Game {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    isActive: boolean;
}

export type CreateGamePayload = Omit<Game, "id">;

export type UpdateGamePayload = Pick<Game, "id" | "name" | "slug">;

export type StatusPayload = Pick<Game, "id" | "isActive">;

interface GameState {
    games: Game[] | null;
    isLoading: boolean;
    getGames: () => Promise<void>;
    createGame: (data: CreateGamePayload) => Promise<void>;
    updateGame: (data: UpdateGamePayload) => Promise<void>;
    toggleGame: (data: StatusPayload) => Promise<void>;
}

export const useGameService = create<GameState>((set) => ({
    games: null,
    isLoading: false,

    getGames: async () => {
        set({ isLoading: true });
        try {
            const res = await api.get('/games');
            const gameData = res.data ?? res;

            set({ games: gameData, isLoading: false });
        } catch (error) {
            set({ games: null, isLoading: false });
        }
    },

    createGame: async (data: CreateGamePayload) => {
        set({ isLoading: true });
        try {
            const res = await api.post('/games', data);
            const newGame: Game = res.data ?? res;

            set((state) => ({
                games: state.games ? [...state.games, newGame] : [newGame],
                isLoading: false,
            }));
        } catch (error) {
            set({ isLoading: false });
        }
    },

    updateGame: async (data: UpdateGamePayload) => {
        set({ isLoading: true });
        try {
            const res = await api.put(`/games/${data.id}`, data);
            const updatedGame: Game = res.data ?? res;

            set((state) => ({
                games: state.games?.map((g) => (g.id === updatedGame.id ? updatedGame : g)) ?? null,
                isLoading: false,
            }));
        } catch (error) {
            set({ isLoading: false });
        }
    },

    toggleGame: async (data: StatusPayload) => {
        set({ isLoading: true });
        try {
            const res = await api.patch(`/games/${data.id}/status`, { isActive: data.isActive });
            const updatedGame: Game = res.data ?? res;

            set((state) => ({
                games: state.games?.map((g) => (g.id === updatedGame.id ? updatedGame : g)) ?? null,
                isLoading: false,
            }));
        } catch (error) {
            set({ isLoading: false });
        }
    },
}));