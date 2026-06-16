import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { login as loginApi, logout as logoutApi, getUserInfo } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken() || '')
  const userInfo = ref(null)
  const role = ref('')
  const isDemoAccount = ref(false)

  const isLoggedIn = computed(() => !!token.value)

  async function login(loginForm) {
    try {
      const res = await loginApi(loginForm)
      token.value = res.data.token
      setToken(res.data.token)
      isDemoAccount.value = !!res.data.isDemo
      await fetchUserInfo()
      return res
    } catch (error) {
      throw error
    }
  }

  async function fetchUserInfo() {
    try {
      const res = await getUserInfo()
      userInfo.value = res.data
      role.value = res.data.role
      return res
    } catch (error) {
      throw error
    }
  }

  async function logout() {
    try {
      await logoutApi()
    } finally {
      resetState()
    }
  }

  function resetState() {
    token.value = ''
    userInfo.value = null
    role.value = ''
    isDemoAccount.value = false
    removeToken()
  }

  return {
    token,
    userInfo,
    role,
    isDemoAccount,
    isLoggedIn,
    login,
    fetchUserInfo,
    logout,
    resetState
  }
}, {
  persist: {
    key: 'sales-email-user',
    paths: ['token', 'userInfo', 'role', 'isDemoAccount']
  }
})
