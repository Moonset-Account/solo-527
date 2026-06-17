import { create } from 'zustand'
import type { Alert } from '@/types/database'

interface UIState {
  sidebarCollapsed: boolean
  activeAlerts: Alert[]
  currentUserId: string | null
  toggleSidebar: () => void
  addAlert: (alert: Alert) => void
  removeAlert: (id: string) => void
  setCurrentUser: (userId: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  activeAlerts: [],
  currentUserId: null,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  addAlert: (alert) => set((state) => ({ activeAlerts: [...state.activeAlerts, alert] })),
  removeAlert: (id) => set((state) => ({ activeAlerts: state.activeAlerts.filter((a) => a.id !== id) })),
  setCurrentUser: (userId) => set({ currentUserId: userId }),
}))
