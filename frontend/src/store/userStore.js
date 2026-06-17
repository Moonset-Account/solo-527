import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoggedIn: false,

      login: (userData, token) => set({
        user: userData,
        token,
        isLoggedIn: true,
      }),

      logout: () => set({
        user: null,
        token: null,
        isLoggedIn: false,
      }),

      updateUser: (userData) => set({
        user: { ...useUserStore.getState().user, ...userData },
      }),
    }),
    {
      name: 'user-storage',
    }
  )
)
