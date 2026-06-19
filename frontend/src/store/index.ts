import { create } from 'zustand';

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: 'ADMIN' | 'TEACHER' | 'OPERATOR';
  phone?: string;
  email?: string;
  avatar?: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isLoggedIn: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  initFromStorage: () => void;
}

const loadUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: loadUser(),
  isLoggedIn: !!localStorage.getItem('token'),
  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isLoggedIn: true });
  },
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isLoggedIn: false });
  },
  initFromStorage: () => {
    const token = localStorage.getItem('token');
    const user = loadUser();
    if (token && user) {
      set({ token, user, isLoggedIn: true });
    }
  },
}));

interface AppState {
  collapsed: boolean;
  currentPath: string;
  toggleCollapsed: () => void;
  setCurrentPath: (path: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  collapsed: false,
  currentPath: '/',
  toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
  setCurrentPath: (path) => set({ currentPath: path }),
}));
