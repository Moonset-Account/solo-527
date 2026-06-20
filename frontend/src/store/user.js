import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useUserStore = create(
  persist(
    (set) => ({
      token: '',
      userInfo: null,
      permissions: [],

      setToken: (token) => set({ token }),

      setUserInfo: (userInfo) => set({ userInfo }),

      setPermissions: (permissions) => set({ permissions }),

      login: (token, userInfo, permissions = []) => set({ token, userInfo, permissions }),

      logout: () => set({ token: '', userInfo: null, permissions: [] })
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ token: state.token, userInfo: state.userInfo, permissions: state.permissions })
    }
  )
)

export default useUserStore
