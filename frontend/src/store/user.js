import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getToken, setToken, removeToken, getUserInfo as loadUserInfo, setUserInfo as persistUserInfo, removeUserInfo } from '@/utils/auth'
import { login, getCurrentUser } from '@/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken())
  const userInfo = ref(loadUserInfo())

  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => userInfo.value?.role || 'MEMBER')
  const isAdmin = computed(() => userRole.value === 'ADMIN')
  const isTeacher = computed(() => userRole.value === 'TEACHER' || userRole.value === 'ADMIN')

  const setToken = (newToken) => {
    token.value = newToken
    if (newToken) {
      setToken(newToken)
    } else {
      removeToken()
    }
  }

  const setUserInfo = (info) => {
    userInfo.value = info
    if (info) {
      persistUserInfo(info)
    } else {
      removeUserInfo()
    }
  }

  const login = async (loginData) => {
    const res = await login(loginData)
    const { token: tokenVal, userInfo: userVal } = res.data || {}
    if (tokenVal) setToken(tokenVal)
    if (userVal) setUserInfo(userVal)
    if (tokenVal && !userVal) {
      try {
        await fetchCurrentUser()
      } catch (_) {}
    }
    return res
  }

  const fetchCurrentUser = async () => {
    const res = await getCurrentUser()
    setUserInfo(res.data)
    return res
  }

  const updateUserInfo = (info) => {
    const merged = { ...(userInfo.value || {}), ...info }
    setUserInfo(merged)
  }

  const logout = async () => {
    token.value = ''
    userInfo.value = null
    removeToken()
    removeUserInfo()
  }

  const hasRole = (roles) => {
    if (!roles || roles.length === 0) return true
    return roles.includes(userRole.value)
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    userRole,
    isAdmin,
    isTeacher,
    login,
    setToken,
    setUserInfo,
    fetchCurrentUser,
    updateUserInfo,
    logout,
    hasRole
  }
})
