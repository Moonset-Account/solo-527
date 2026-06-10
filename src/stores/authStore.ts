import { create } from 'zustand'

interface User {
  id: string
  username: string
  name: string
  role: string
  avatar?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: '登录失败' }))
        throw new Error(err.message || '登录失败')
      }
      const data = await res.json()
      localStorage.setItem('token', data.token)
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null, isAuthenticated: false })
  },

  checkAuth: async () => {
    const token = get().token
    if (!token) {
      set({ isAuthenticated: false, user: null })
      return
    }
    set({ isLoading: true })
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        localStorage.removeItem('token')
        set({ user: null, token: null, isAuthenticated: false, isLoading: false })
        return
      }
      const data = await res.json()
      set({ user: data.user || data, isAuthenticated: true, isLoading: false })
    } catch {
      localStorage.removeItem('token')
      set({ user: null, token: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
