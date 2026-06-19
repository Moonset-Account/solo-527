'use client';

import { create } from 'zustand';
import type { SavedFilter, User } from '@/lib/types';
import { mockSavedFilters, mockUsers } from '@/lib/mockData';

interface AppState {
  currentUser: User;
  setCurrentUser: (user: User) => void;

  savedFilters: SavedFilter[];
  addSavedFilter: (filter: Omit<SavedFilter, 'id' | 'user_id' | 'created_at'>) => void;
  removeSavedFilter: (id: string) => void;
  setDefaultFilter: (pageKey: string, id: string) => void;

  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  activePage: string;
  setActivePage: (page: string) => void;
}

const currentUser: User = mockUsers[0];

export const useAppStore = create<AppState>((set, get) => ({
  currentUser,
  setCurrentUser: (user) => set({ currentUser: user }),

  savedFilters: mockSavedFilters.filter((f) => f.user_id === currentUser.id),
  addSavedFilter: (filter) => {
    const newFilter: SavedFilter = {
      ...filter,
      id: `f-${Date.now()}`,
      user_id: get().currentUser.id,
      created_at: new Date().toISOString(),
    };
    set((state) => ({
      savedFilters: filter.is_default
        ? [
            ...state.savedFilters.map((f) =>
              f.page_key === filter.page_key ? { ...f, is_default: false } : f
            ),
            newFilter,
          ]
        : [...state.savedFilters, newFilter],
    }));
  },
  removeSavedFilter: (id) =>
    set((state) => ({
      savedFilters: state.savedFilters.filter((f) => f.id !== id),
    })),
  setDefaultFilter: (pageKey, id) =>
    set((state) => ({
      savedFilters: state.savedFilters.map((f) =>
        f.page_key === pageKey ? { ...f, is_default: f.id === id } : f
      ),
    })),

  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  activePage: '/',
  setActivePage: (page) => set({ activePage: page }),
}));
