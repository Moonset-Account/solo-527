import { defineStore } from 'pinia'
import api, { setToken, removeToken, setStoredUser, getStoredUser, getToken } from '~/utils/api'
import type { User } from '~/types'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: null as string | null,
    isLoading: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userRole: (state) => state.user?.role || null,
    isAdmin: (state) => state.user?.role === 'admin',
    isRecruiter: (state) => state.user?.role === 'recruiter',
    isCandidate: (state) => state.user?.role === 'candidate',
  },

  actions: {
    init() {
      const token = getToken()
      const user = getStoredUser()
      if (token && user) {
        this.token = token
        this.user = user
      }
    },

    async login(username: string, password: string) {
      this.isLoading = true
      try {
        const formData = new FormData()
        formData.append('username', username)
        formData.append('password', password)
        const response = await api.post('/auth/login', formData)
        const { access_token, user } = response.data
        this.token = access_token
        this.user = user
        setToken(access_token)
        setStoredUser(user)
        return user
      } finally {
        this.isLoading = false
      }
    },

    async register(userData: any) {
      this.isLoading = true
      try {
        const response = await api.post('/auth/register', userData)
        return response.data
      } finally {
        this.isLoading = false
      }
    },

    async fetchCurrentUser() {
      try {
        const response = await api.get('/auth/me')
        this.user = response.data
        setStoredUser(response.data)
        return response.data
      } catch (error) {
        this.logout()
        throw error
      }
    },

    logout() {
      this.token = null
      this.user = null
      removeToken()
      navigateTo('/login')
    },
  },
})
