import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { authApi } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoading = ref(false)

  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role ?? null)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isPM = computed(() => user.value?.role === 'project_pm')
  const isDutyStaff = computed(() => user.value?.role === 'duty_staff')
  const canManageReminders = computed(() => isAdmin.value || isPM.value)
  const canManageAdmin = computed(() => isAdmin.value)

  async function login(email: string, password: string) {
    isLoading.value = true
    try {
      const { data } = await authApi.login({ email, password })
      token.value = data.token
      user.value = data.user
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMe() {
    try {
      const { data } = await authApi.me()
      user.value = data
    } catch {
      logout()
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  function initFromStorage() {
    const storedUser = localStorage.getItem('user')
    if (storedUser && token.value) {
      try {
        user.value = JSON.parse(storedUser)
      } catch {
        logout()
      }
    }
  }

  return {
    user,
    token,
    isLoading,
    isLoggedIn,
    userRole,
    isAdmin,
    isPM,
    isDutyStaff,
    canManageReminders,
    canManageAdmin,
    login,
    fetchMe,
    logout,
    initFromStorage,
  }
})
