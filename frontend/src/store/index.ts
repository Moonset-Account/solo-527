import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, LoginRequest, LoginResponse } from '../types'
import { auth, setToken as setApiToken, setRefreshToken as setApiRefreshToken, removeToken, removeRefreshToken } from '../api'

interface UserState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isLoggedIn: boolean
  isLoading: boolean
  login: (data: LoginRequest) => Promise<LoginResponse>
  logout: () => Promise<void>
  updateUserInfo: (user: Partial<User>) => void
  setToken: (token: string) => void
  setRefreshToken: (refreshToken: string) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoggedIn: false,
      isLoading: false,

      login: async (data: LoginRequest) => {
        set({ isLoading: true })
        try {
          const response = await auth.login(data)
          set({
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
            isLoggedIn: true,
            isLoading: false
          })
          setApiToken(response.token)
          setApiRefreshToken(response.refreshToken)
          return response
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          await auth.logout()
        } finally {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isLoggedIn: false,
            isLoading: false
          })
          removeToken()
          removeRefreshToken()
        }
      },

      updateUserInfo: (user: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...user } : null
        }))
      },

      setToken: (token: string) => {
        set({ token })
        setApiToken(token)
      },

      setRefreshToken: (refreshToken: string) => {
        set({ refreshToken })
        setApiRefreshToken(refreshToken)
      },

      clearUser: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isLoggedIn: false
        })
        removeToken()
        removeRefreshToken()
      }
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isLoggedIn: state.isLoggedIn
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          setApiToken(state.token)
        }
        if (state?.refreshToken) {
          setApiRefreshToken(state.refreshToken)
        }
      }
    }
  )
)
