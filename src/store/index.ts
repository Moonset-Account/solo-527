import { create } from 'zustand'
import type { AuthUser, FilterParams } from '@/types'

interface AppState {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
  sidebarOpen: boolean
  toggleSidebar: () => void
  filters: FilterParams
  setFilters: (filters: Partial<FilterParams>) => void
  resetFilters: () => void
}

const defaultFilters: FilterParams = {}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  filters: { ...defaultFilters },
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),
}))
