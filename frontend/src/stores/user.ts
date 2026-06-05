import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, type LoginData, type User } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const user = ref<User | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isMember = computed(() => ['admin', 'member'].includes(user.value?.role || ''))
  const isExternal = computed(() => user.value?.role === 'external')

  async function login(data: LoginData) {
    const response = await authApi.login(data)
    token.value = response.access_token
    user.value = response.user
    localStorage.setItem('token', response.access_token)
    localStorage.setItem('user', JSON.stringify(response.user))
    return response
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  function restoreSession() {
    const savedUser = localStorage.getItem('user')
    if (savedUser && token.value) {
      try {
        user.value = JSON.parse(savedUser)
      } catch (e) {
        logout()
      }
    }
  }

  return {
    token,
    user,
    isLoggedIn,
    isAdmin,
    isMember,
    isExternal,
    login,
    logout,
    restoreSession
  }
})
