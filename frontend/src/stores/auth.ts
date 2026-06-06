import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import * as authApi from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('auth_token') || '')
  const client = ref<string>(localStorage.getItem('auth_client') || '')
  const uid = ref<string>(localStorage.getItem('auth_uid') || '')
  const user = ref<User | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin' || user.value?.role === 'super_admin')
  const isSuperAdmin = computed(() => user.value?.role === 'super_admin')

  const setAuthInfo = (data: { token: string; client: string; uid: string }) => {
    token.value = data.token
    client.value = data.client
    uid.value = data.uid
    localStorage.setItem('auth_token', data.token)
    localStorage.setItem('auth_client', data.client)
    localStorage.setItem('auth_uid', data.uid)
  }

  const setUser = (userData: User) => {
    user.value = userData
  }

  const login = async (email: string, password: string) => {
    const response: any = await authApi.login(email, password)
    if (response.data) {
      setUser(response.data)
    }
    return response
  }

  const register = async (data: any) => {
    const response: any = await authApi.register(data)
    if (response.data) {
      setUser(response.data)
    }
    return response
  }

  const fetchCurrentUser = async () => {
    if (!token.value) return null
    try {
      const response: any = await authApi.getCurrentUser()
      if (response.data) {
        setUser(response.data)
        return response.data
      }
    } catch (error) {
      logout()
    }
    return null
  }

  const logout = () => {
    token.value = ''
    client.value = ''
    uid.value = ''
    user.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_client')
    localStorage.removeItem('auth_uid')
  }

  return {
    token,
    client,
    uid,
    user,
    isLoggedIn,
    isAdmin,
    isSuperAdmin,
    setAuthInfo,
    setUser,
    login,
    register,
    fetchCurrentUser,
    logout
  }
})
