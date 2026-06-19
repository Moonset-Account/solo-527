import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginParams, LoginResult } from '@/types'
import { login as loginApi, logout as logoutApi } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const userInfo = ref<User | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const setUserInfo = (user: User) => {
    userInfo.value = user
    localStorage.setItem('userInfo', JSON.stringify(user))
  }

  const clearUser = () => {
    token.value = null
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  const login = async (params: LoginParams) => {
    const result: LoginResult = await loginApi(params)
    setToken(result.token)
    setUserInfo(result.user)
    return result
  }

  const logout = async () => {
    try {
      await logoutApi()
    } finally {
      clearUser()
    }
  }

  const loadUserInfo = () => {
    const stored = localStorage.getItem('userInfo')
    if (stored) {
      try {
        userInfo.value = JSON.parse(stored)
      } catch {
        userInfo.value = null
      }
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    login,
    logout,
    setToken,
    setUserInfo,
    clearUser,
    loadUserInfo,
  }
})
