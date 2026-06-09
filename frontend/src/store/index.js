import { create } from 'zustand'

const getInitialUser = () => {
  try {
    const saved = localStorage.getItem('user_info')
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('access_token') || '',
  user: getInitialUser(),
  isAuthenticated: !!localStorage.getItem('access_token'),

  login: (token, user) => {
    localStorage.setItem('access_token', token)
    localStorage.setItem('user_info', JSON.stringify(user))
    set({ token, user, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_info')
    set({ token: '', user: null, isAuthenticated: false })
  },

  updateUser: (user) => {
    localStorage.setItem('user_info', JSON.stringify(user))
    set({ user })
  },
}))

export const useAppStore = create((set) => ({
  activeModelVersion: null,
  currentBatchId: null,
  setActiveModelVersion: (v) => set({ activeModelVersion: v }),
  setCurrentBatchId: (id) => set({ currentBatchId: id }),
}))
