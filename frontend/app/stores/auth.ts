import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '~/utils/api'
import type { User, LoginRequest } from '~/types'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const user = ref<User | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role ?? '')
  const displayName = computed(() => user.value?.display_name ?? user.value?.username ?? '')

  function init() {
    if (import.meta.client) {
      const saved = localStorage.getItem('token')
      if (saved) {
        token.value = saved
        fetchUser()
      }
    }
  }

  async function login(data: LoginRequest) {
    const res = await authApi.login(data)
    token.value = res.access_token
    if (import.meta.client) {
      localStorage.setItem('token', res.access_token)
    }
    await fetchUser()
  }

  async function fetchUser() {
    try {
      user.value = await authApi.me()
    } catch {
      logout()
    }
  }

  function logout() {
    token.value = null
    user.value = null
    if (import.meta.client) {
      localStorage.removeItem('token')
    }
  }

  function hasRole(role: string): boolean {
    return userRole.value === role
  }

  return { token, user, isLoggedIn, userRole, displayName, init, login, fetchUser, logout, hasRole }
})
