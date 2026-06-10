import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, register as apiRegister, getProfile } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const userInfo = ref(null)

  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => userInfo.value?.role || '')

  async function login(loginData) {
    const res = await apiLogin(loginData.username, loginData.password)
    token.value = res.access_token
    userInfo.value = res.user
    return res
  }

  async function register(registerData) {
    const res = await apiRegister(registerData)
    return res
  }

  async function fetchProfile() {
    try {
      const res = await getProfile()
      userInfo.value = res
      return res
    } catch (e) {
      token.value = ''
      userInfo.value = null
      throw e
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = null
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    userRole,
    login,
    register,
    fetchProfile,
    logout,
  }
}, {
  persist: {
    paths: ['token', 'userInfo'],
  },
})
