import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginParams } from '@/types'
import { loginApi, logoutApi, getUserInfoApi } from '@/api/modules/auth'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<User | null>(null)

  if (token.value) {
    const savedUser = localStorage.getItem(USER_KEY)
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
      } catch {
        user.value = null
      }
    }
  }

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userRole = computed(() => user.value?.role || null)

  async function login(params: LoginParams) {
    const res = await loginApi(params)

    token.value = res.token
    user.value = res.user

    localStorage.setItem(TOKEN_KEY, res.token)
    localStorage.setItem(USER_KEY, JSON.stringify(res.user))

    return res.user
  }

  async function logout() {
    try {
      if (token.value) await logoutApi()
    } catch {
      // ignore
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }
  }

  async function reloadUser() {
    if (token.value) {
      try {
        const u = await getUserInfoApi()
        user.value = u
        localStorage.setItem(USER_KEY, JSON.stringify(u))
      } catch {
        // ignore
      }
    }
  }

  function hasRole(roles: string | string[]) {
    if (!user.value) return false
    if (Array.isArray(roles)) {
      return roles.includes(user.value.role)
    }
    return user.value.role === roles
  }

  return {
    token,
    user,
    isAuthenticated,
    userRole,
    login,
    logout,
    reloadUser,
    hasRole
  }
})
