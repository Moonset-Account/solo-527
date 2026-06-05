import { createContextId, useContext, useStore, useTask$ } from '@builder.io/qwik';
import type { Signal } from '@builder.io/qwik';
import { createContext, useContextProvider, $ } from '@builder.io/qwik';
import axios from 'axios';

export type UserRole = 'member' | 'operator' | 'admin';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  phone: string;
  points: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
}

export const AuthContext = createContextId<AuthContextType>('auth-context');

export function createAuthStore(): AuthContextType {
  const store = useStore({
    user: null as User | null,
    token: null as string | null,
    isAuthenticated: false,
  });

  useTask$(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    if (savedToken) {
      store.token = savedToken;
      store.isAuthenticated = true;
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
    if (savedUser) {
      store.user = JSON.parse(savedUser);
    }
  });

  const login = $(async (username: string, password: string) => {
    const response = await axios.post('/api/auth/login', { username, password });
    const { user, token } = response.data;
    
    store.user = user;
    store.token = token;
    store.isAuthenticated = true;
    
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  });

  const logout = $(async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (e) {}
    
    store.user = null;
    store.token = null;
    store.isAuthenticated = false;
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    delete axios.defaults.headers.common['Authorization'];
  });

  const fetchCurrentUser = $(async () => {
    if (!store.token) return;
    
    try {
      const response = await axios.get('/api/auth/me');
      store.user = response.data;
      localStorage.setItem('auth_user', JSON.stringify(response.data));
    } catch (error) {
      await logout();
    }
  });

  return {
    get user() { return store.user; },
    get token() { return store.token; },
    get isAuthenticated() { return store.isAuthenticated; },
    login,
    logout,
    fetchCurrentUser,
  };
}

export function useAuth() {
  return useContext(AuthContext);
}
