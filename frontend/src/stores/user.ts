import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, getProfile, refreshToken } from '@/api/auth'
import { ElMessage } from 'element-plus'

export interface UserInfo {
  id: string
  username: string
  name: string
  role: 'admin' | 'manager' | 'operator' | 'viewer'
  email: string
  phone?: string
  department?: string
  status: string
  permissionExpireAt?: string
  avatar?: string
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  const refreshTokenVal = ref<string>('')
  const userInfo = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value?.role === 'admin')
  const isManager = computed(() => ['admin', 'manager'].includes(userInfo.value?.role || ''))

  async function doLogin(username: string, password: string) {
    const res = await login({ username, password })
    token.value = res.accessToken
    refreshTokenVal.value = res.refreshToken
    userInfo.value = res.user
    saveToStorage()
    checkPermissionExpiry()
    return res
  }

  async function doLogout() {
    try {
      await logout()
    } catch (e) {}
    clearAll()
  }

  async function fetchProfile() {
    try {
      userInfo.value = await getProfile()
      saveToStorage()
    } catch (e) {
      clearAll()
      throw e
    }
  }

  async function refreshAccessToken() {
    if (!refreshTokenVal.value) {
      clearAll()
      return false
    }
    try {
      const res = await refreshToken(refreshTokenVal.value)
      token.value = res.accessToken
      saveToStorage()
      return true
    } catch (e) {
      clearAll()
      return false
    }
  }

  function saveToStorage() {
    localStorage.setItem('gm_token', token.value)
    localStorage.setItem('gm_refreshToken', refreshTokenVal.value)
    localStorage.setItem('gm_userInfo', JSON.stringify(userInfo.value))
  }

  function restoreFromStorage() {
    token.value = localStorage.getItem('gm_token') || ''
    refreshTokenVal.value = localStorage.getItem('gm_refreshToken') || ''
    const ui = localStorage.getItem('gm_userInfo')
    if (ui) {
      try {
        userInfo.value = JSON.parse(ui)
      } catch {
        userInfo.value = null
      }
    }
  }

  function clearAll() {
    token.value = ''
    refreshTokenVal.value = ''
    userInfo.value = null
    localStorage.removeItem('gm_token')
    localStorage.removeItem('gm_refreshToken')
    localStorage.removeItem('gm_userInfo')
  }

  function checkPermissionExpiry() {
    if (!userInfo.value?.permissionExpireAt) return
    const expire = new Date(userInfo.value.permissionExpireAt).getTime()
    const now = Date.now()
    const daysLeft = Math.ceil((expire - now) / (1000 * 60 * 60 * 24))

    if (daysLeft <= 0) {
      ElMessage.error('账号权限已过期，请联系运营负责人')
      clearAll()
    } else if (daysLeft <= 7) {
      ElMessage.warning(`您的账号权限将在 ${daysLeft} 天后过期，请联系运营负责人续费`)
    }
  }

  return {
    token,
    refreshTokenVal,
    userInfo,
    isLoggedIn,
    isAdmin,
    isManager,
    doLogin,
    doLogout,
    fetchProfile,
    refreshAccessToken,
    restoreFromStorage,
    clearAll
  }
})
