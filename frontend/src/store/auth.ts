import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi, User } from '../api/auth'

interface AuthState {
  token: string | null
  user: User | null
  setToken: (token: string) => void
  setUser: (user: User) => void
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      login: async (username, password) => {
        const res = await authApi.login({ username, password })
        set({ token: res.token, user: res.user })
      },
      logout: () => {
        try {
          authApi.logout()
        } catch (e) {
        }
        set({ token: null, user: null })
      },
      fetchUser: async () => {
        try {
          const user = await authApi.me()
          set({ user })
        } catch (e) {
          set({ token: null, user: null })
        }
      },
    }),
    {
      name: 'ops-workbench-auth',
    }
  )
)
