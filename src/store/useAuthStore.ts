import { create } from "zustand";
import type { User, UserRole } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const demoUser: User = {
  id: "u-001",
  email: "admin@tcm.com",
  full_name: "张运营",
  role: "operation",
  department: "运营部",
  created_at: "2026-01-01T00:00:00Z",
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: demoUser,
  isAuthenticated: true,
  login: async (email: string, _password: string) => {
    await new Promise((r) => setTimeout(r, 400));
    if (email) {
      set({ user: demoUser, isAuthenticated: true });
      return true;
    }
    return false;
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
  hasRole: (roles) => {
    const user = get().user;
    if (!user) return false;
    return roles.includes(user.role);
  },
}));
