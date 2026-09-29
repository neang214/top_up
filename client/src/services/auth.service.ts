import { create } from "zustand";
import { api } from "./api";

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password?: string;
}

interface AuthState {
  userInfo: User | null;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  login: (data: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logOut: () => Promise<void>;
}

export const useAuthService = create<AuthState>((set) => ({
  userInfo: null,
  isLoading: false,

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/auth/me');
      const userData = res.data ?? res; 

      set({ userInfo: userData, isLoading: false });
    } catch (error) {
      set({ userInfo: null, isLoading: false });
    }
  },

  login: async (data: LoginPayload) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', data);
      const userData = res.data ?? res;

      set({ userInfo: userData, isLoading: false });
    } catch (error) {
      set({ userInfo: null, isLoading: false });
      throw error;
    }
  },

  register: async (data: RegisterPayload) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/register', data);
      const userData = res.data ?? res;

      set({ userInfo: userData, isLoading: false });
    } catch (error) {
      set({ userInfo: null, isLoading: false });
      throw error;
    }
  },

  logOut: async () => {
    set({ isLoading: true });
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      set({ userInfo: null, isLoading: false });
    }
  }
}));