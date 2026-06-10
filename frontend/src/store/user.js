import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getToken as readToken,
  setToken as writeToken,
  removeToken,
  getUserInfo as readUserInfo,
  setUserInfo as writeUserInfo,
  removeUserInfo
} from '@/utils/auth'
import { login as apiLogin, getCurrentUser as apiGetCurrentUser } from '@/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(readToken())
  const userInfo = ref(readUserInfo())

  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => userInfo.value?.role || 'MEMBER')
  const isAdmin = computed(() => userRole.value === 'ADMIN')
  const isTeacher = computed(() => userRole.value === 'TEACHER' || userRole.value === 'ADMIN')

  const saveToken = (newToken) => {
    token.value = newToken
    if (newToken) {
      writeToken(newToken)
    } else {
      removeToken()
    }
  }

  const saveUserInfo = (info) => {
    userInfo.value = info
    if (info) {
      writeUserInfo(info)
    } else {
      removeUserInfo()
    }
  }

  const doLogin = async (loginData) => {
    const res = await apiLogin(loginData)
    const data = res.data || {}
    saveToken(data.token)
    const info = {
      id: data.userId,
      userId: data.userId,
      username: data.username,
      nickname: data.nickname,
      avatar: data.avatar,
      role: data.role
    }
    saveUserInfo(info)
    return res
  }

  const fetchCurrentUser = async () => {
    const res = await apiGetCurrentUser()
    const data = res.data || {}
    saveUserInfo({
      id: data.id,
      userId: data.id,
      username: data.username,
      nickname: data.nickname,
      avatar: data.avatar,
      role: data.role,
      phone: data.phone,
      email: data.email,
      memberExpireTime: data.memberExpireTime
    })
    return res
  }

  const updateUserInfo = (info) => {
    const merged = { ...(userInfo.value || {}), ...info }
    saveUserInfo(merged)
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
    login: doLogin,
    saveToken,
    saveUserInfo,
    fetchCurrentUser,
    updateUserInfo,
    logout,
    hasRole
  }
})
