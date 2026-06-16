import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, getUserInfo as apiGetUserInfo } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))

  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const setUserInfo = (info) => {
    userInfo.value = info
    localStorage.setItem('userInfo', JSON.stringify(info))
  }

  const username = computed(() => userInfo.value?.realName || userInfo.value?.username || '')
  
  const roles = computed(() => userInfo.value?.roles || [])
  
  const isAdmin = computed(() => {
    const roleList = userInfo.value?.roles || []
    return roleList.some(role => ['admin', 'manager'].includes(role))
  })

  const isLoggedIn = computed(() => !!token.value)

  const login = async (loginData) => {
    const data = await apiLogin(loginData)
    if (data) {
      setToken(data.token)
      const info = { ...data }
      delete info.token
      setUserInfo(info)
    }
    return data
  }

  const fetchUserInfo = async () => {
    const data = await apiGetUserInfo()
    if (data) {
      setUserInfo(data)
    }
    return data
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  return {
    token,
    userInfo,
    username,
    roles,
    isAdmin,
    isLoggedIn,
    setToken,
    setUserInfo,
    login,
    fetchUserInfo,
    logout
  }
})
