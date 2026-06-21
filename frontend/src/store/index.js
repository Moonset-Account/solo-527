import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, refreshToken, user) => set({
        token,
        refreshToken,
        user,
        isAuthenticated: true
      }),
      setUser: (user) => set({ user }),
      logout: () => set({
        token: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false
      })
    }),
    {
      name: 'auth-storage'
    }
  )
)

export const useAppStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  savedFilters: {},
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1
  })),
  setSavedFilters: (module, filters) => set((state) => ({
    savedFilters: { ...state.savedFilters, [module]: filters }
  }))
}))
