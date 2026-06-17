'use client';

import { create } from 'zustand';
import type { User } from '@/lib/types';
import { mockUser, mockAdminUser } from '@/lib/mockData';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loginAsAdmin: () => void;
  loginAsCustomer: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: mockUser,
  isAdmin: false,
  isLoading: false,
  login: async (email: string) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    if (email.includes('admin')) {
      set({ user: mockAdminUser, isAdmin: true, isLoading: false });
      return true;
    }
    set({ user: mockUser, isAdmin: false, isLoading: false });
    return true;
  },
  logout: () => {
    set({ user: null, isAdmin: false });
  },
  loginAsAdmin: () => {
    set({ user: mockAdminUser, isAdmin: true });
  },
  loginAsCustomer: () => {
    set({ user: mockUser, isAdmin: false });
  },
}));
