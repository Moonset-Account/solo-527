import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, getUserInfo } from '~/api/auth'
import type { UserInfo, LoginRequest } from '~/types'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(null)
  const userInfo = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const permissions = computed(() => userInfo.value?.permissions || [])
  const roles = computed(() => userInfo.value?.roles || [])

  function setToken(t: string) {
    token.value = t
    if (import.meta.client) {
      localStorage.setItem('token', t)
    }
  }

  function clearToken() {
    token.value = null
    if (import.meta.client) {
      localStorage.removeItem('token')
    }
  }

  function initToken() {
    if (import.meta.client) {
      const savedToken = localStorage.getItem('token')
      if (savedToken) {
        token.value = savedToken
      }
    }
  }

  async function loginAction(data: LoginRequest) {
    const res = await login(data)
    if (res.code === 200) {
      setToken(res.data.access_token)
      await fetchUserInfo()
    }
    return res
  }

  async function fetchUserInfo() {
    try {
      const res = await getUserInfo()
      if (res.code === 200) {
        userInfo.value = res.data
      }
      return res
    } catch (e) {
      clearToken()
      throw e
    }
  }

  async function logoutAction() {
    try {
      await logout()
    } finally {
      clearToken()
      userInfo.value = null
    }
  }

  function hasPermission(perm: string): boolean {
    if (!permissions.value.length) return false
    return permissions.value.includes(perm) || roles.value.some(r => r.code === 'admin')
  }

  function hasRole(roleCode: string): boolean {
    return roles.value.some(r => r.code === roleCode || r.code === 'admin')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    permissions,
    roles,
    setToken,
    clearToken,
    initToken,
    loginAction,
    fetchUserInfo,
    logoutAction,
    hasPermission,
    hasRole,
  }
})
