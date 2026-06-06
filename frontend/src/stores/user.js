import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '@/utils/request'

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const userInfo = ref(null)
  const roles = ref([])
  const permissions = ref([])

  const isLoggedIn = computed(() => !!token.value)
  const hasRole = (role) => roles.value.includes(role)
  const hasPermission = (permission) => permissions.value.includes(permission)

  async function login(credentials) {
    const response = await request.post('/login', credentials)
    
    token.value = response.data.token
    userInfo.value = response.data.user
    roles.value = response.data.user.roles || []
    permissions.value = response.data.user.permissions || []
    
    return response
  }

  async function logout() {
    try {
      await request.post('/logout')
    } catch (e) {
      console.error('Logout error:', e)
    } finally {
      clearUserData()
    }
  }

  async function fetchUserInfo() {
    const response = await request.get('/user')
    
    userInfo.value = response.data
    roles.value = response.data.roles || []
    permissions.value = response.data.permissions || []
    
    return response
  }

  function clearUserData() {
    token.value = ''
    userInfo.value = null
    roles.value = []
    permissions.value = []
  }

  return {
    token,
    userInfo,
    roles,
    permissions,
    isLoggedIn,
    hasRole,
    hasPermission,
    login,
    logout,
    fetchUserInfo,
    clearUserData,
  }
}, {
  persist: {
    paths: ['token', 'userInfo', 'roles', 'permissions'],
  },
})
