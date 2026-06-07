import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  login as apiLogin,
  register as apiRegister,
  fetchCurrentUser,
  clearToken,
  getToken,
  type UserInfo,
} from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserInfo | null>(null)
  const loading = ref(false)

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isManager = computed(() => user.value?.role === 'manager' || user.value?.role === 'admin')
  const displayName = computed(() => user.value?.displayName || '')
  const role = computed(() => user.value?.role || '')
  const pondScope = computed(() => user.value?.pondScope || null)

  const ROLE_LABELS: Record<string, string> = {
    technician: '技术员',
    manager: '场长',
    admin: '管理员',
  }

  const roleLabel = computed(() => ROLE_LABELS[role.value] || '')

  async function init() {
    const token = getToken()
    if (!token) {
      user.value = null
      return
    }
    loading.value = true
    try {
      user.value = await fetchCurrentUser()
    } catch {
      user.value = null
      clearToken()
    } finally {
      loading.value = false
    }
  }

  async function login(username: string, password: string) {
    loading.value = true
    try {
      const result = await apiLogin({ username, password })
      user.value = result.user
      return result
    } finally {
      loading.value = false
    }
  }

  async function register(params: {
    username: string
    password: string
    displayName: string
    role?: string
    pondScope?: string
  }) {
    loading.value = true
    try {
      const result = await apiRegister(params)
      user.value = result.user
      return result
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value = null
    clearToken()
  }

  function canAccessPond(pondId: string): boolean {
    if (!user.value) return false
    if (user.value.role === 'admin' || user.value.role === 'manager') return true
    if (user.value.pondScope) return user.value.pondScope.includes(pondId)
    return false
  }

  return {
    user,
    loading,
    isLoggedIn,
    isAdmin,
    isManager,
    displayName,
    role,
    roleLabel,
    pondScope,
    init,
    login,
    register,
    logout,
    canAccessPond,
  }
})
