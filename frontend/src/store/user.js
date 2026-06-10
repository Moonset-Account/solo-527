import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getToken, setToken, removeToken, getUserInfo, setUserInfo, removeUserInfo } from '@/utils/auth'
import { login, getUserInfo as fetchUserInfo, logout as apiLogout } from '@/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken())
  const userInfo = ref(getUserInfo())

  const isLoggedIn = computed(() => !!token.value)

  const doLogin = async (loginData) => {
    try {
      const res = await login(loginData)
      token.value = res.data.token
      setToken(res.data.token)
      if (res.data.userInfo) {
        userInfo.value = res.data.userInfo
        setUserInfo(res.data.userInfo)
      }
      return res
    } catch (error) {
      throw error
    }
  }

  const fetchCurrentUserInfo = async () => {
    try {
      const res = await fetchUserInfo()
      userInfo.value = res.data
      setUserInfo(res.data)
      return res
    } catch (error) {
      throw error
    }
  }

  const updateUserInfo = (info) => {
    userInfo.value = { ...userInfo.value, ...info }
    setUserInfo(userInfo.value)
  }

  const logout = async () => {
    try {
      await apiLogout()
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      token.value = ''
      userInfo.value = null
      removeToken()
      removeUserInfo()
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    doLogin,
    fetchCurrentUserInfo,
    updateUserInfo,
    logout
  }
})
