import { create } from "zustand";
import { User } from "@shared/types";
import { get as apiGet, post as apiPost } from "@/api/client";

interface LoginResponse {
  token: string;
  user: User;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  setUser: (user: User) => void;
  getToken: () => string | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: !!localStorage.getItem("token"),

  login: async (username: string, password: string) => {
    const data = await apiPost<LoginResponse>("/api/auth/login", {
      username,
      password,
    });
    localStorage.setItem("token", data.token);
    set({
      token: data.token,
      user: data.user,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem("token");
    set({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  },

  loadUser: async () => {
    try {
      const user = await apiGet<User>("/api/auth/me");
      set({ user, isAuthenticated: true });
    } catch {
      get().logout();
    }
  },

  setUser: (user: User) => {
    set({ user });
  },

  getToken: () => {
    return get().token;
  },
}));
