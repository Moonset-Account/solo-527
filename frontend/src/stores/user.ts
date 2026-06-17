import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, userApi } from '@/api'
import type { User, LoginParams } from '@/types'
import { UserRole } from '@/types'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const user = ref<User | null>(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const roles = computed(() => user.value?.roles || [])
  const userId = computed(() => user.value?._id || '')

  const isManager = computed(() =>
    roles.value.some((r) =>
      [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER, UserRole.LAB_MANAGER].includes(r)
    )
  )
  const isSuperAdmin = computed(() => roles.value.includes(UserRole.SUPER_ADMIN))
  const isReagentManager = computed(() => roles.value.includes(UserRole.REAGENT_MANAGER))

  function hasRole(targetRole: UserRole | UserRole[]) {
    if (Array.isArray(targetRole)) {
      return targetRole.some((r) => roles.value.includes(r))
    }
    return roles.value.includes(targetRole)
  }

  async function login(params: LoginParams) {
    const res = await authApi.login(params)
    token.value = res.accessToken
    user.value = res.user
    localStorage.setItem('token', res.accessToken)
    localStorage.setItem('user', JSON.stringify(res.user))
    return res
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      token.value = ''
      user.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  async function fetchUserInfo() {
    try {
      const res = await userApi.me()
      user.value = res
      localStorage.setItem('user', JSON.stringify(res))
      return res
    } catch {
      token.value = ''
      user.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return null
    }
  }

  function initAuth() {
    if (token.value && !user.value) {
      fetchUserInfo()
    }
  }

  return {
    token,
    user,
    isLoggedIn,
    roles,
    userId,
    isManager,
    isSuperAdmin,
    isReagentManager,
    hasRole,
    login,
    logout,
    fetchUserInfo,
    initAuth,
  }
})
