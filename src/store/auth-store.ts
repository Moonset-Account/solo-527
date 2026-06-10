'use client';

import { create } from 'zustand';
import type { User } from '@/types';
import { mockUsers } from '@/lib/mock-data';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, name: string, password: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: mockUsers[0],
  isAuthenticated: true,
  isLoading: false,
  login: async (email: string, password: string) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const user = mockUsers.find((u) => u.email === email);
    if (user && password.length >= 8) {
      set({ user, isAuthenticated: true, isLoading: false });
      return true;
    }
    set({ isLoading: false });
    return false;
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
  register: async (email: string, name: string, password: string) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    if (password.length < 8) {
      set({ isLoading: false });
      return false;
    }
    
    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      name,
      role: 'USER',
      avatarUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    set({ user: newUser, isAuthenticated: true, isLoading: false });
    return true;
  },
}));
