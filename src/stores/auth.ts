import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { authApi } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref<User | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const userPermissions = computed(() => user.value?.permissions || [])
  const userRole = computed(() => user.value?.role || '')

  async function login(username: string, password: string) {
    const { data } = await authApi.login({ username, password })
    token.value = data.token
    user.value = data.user
    localStorage.setItem('token', data.token)
  }

  async function fetchProfile() {
    const { data } = await authApi.profile()
    user.value = data
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
  }

  return { token, user, isLoggedIn, userPermissions, userRole, login, fetchProfile, logout }
})
