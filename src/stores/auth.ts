import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth as authApi } from '@/lib/api'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => !!token.value)

  const login = async (username: string, password: string) => {
    const response = await authApi.login(username, password)
    const { accessToken, refreshToken: refresh, user: userData } = response
    token.value = accessToken
    refreshToken.value = refresh
    user.value = userData
    localStorage.setItem('token', accessToken)
    localStorage.setItem('refreshToken', refresh)
    return response
  }

  const refresh = async () => {
    if (!refreshToken.value) {
      throw new Error('No refresh token available')
    }
    const response = await authApi.refreshToken(refreshToken.value)
    token.value = response.accessToken
    refreshToken.value = response.refreshToken
    localStorage.setItem('token', response.accessToken)
    localStorage.setItem('refreshToken', response.refreshToken)
    return response
  }

  const logout = () => {
    token.value = null
    refreshToken.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  }

  const fetchProfile = async () => {
    const response = await authApi.getProfile()
    user.value = response
    return response
  }

  return {
    token,
    refreshToken,
    user,
    isAuthenticated,
    login,
    refresh,
    logout,
    fetchProfile,
  }
})
