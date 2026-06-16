import { defineStore } from 'pinia'
import { getToken, setToken, removeToken, getUserInfo, setUserInfo, removeUserInfo } from '@/utils/auth'
import { login, logout, getUserInfo as fetchUserInfo } from '@/api/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken() || '',
    userInfo: getUserInfo() || null
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token,
    username: (state) => state.userInfo?.username || '',
    roles: (state) => state.userInfo?.roles || [],
    isAdmin: (state) => {
      const roles = state.userInfo?.roles || []
      return roles.some(role => ['ADMIN', 'MANAGER'].includes(role))
    }
  },
  
  actions: {
    async login(loginData) {
      const res = await login(loginData)
      const { token, ...userInfo } = res.data
      this.token = token
      this.userInfo = userInfo
      setToken(token)
      setUserInfo(userInfo)
      return res
    },
    
    async logout() {
      try {
        await logout()
      } catch (e) {
        console.error('Logout error:', e)
      } finally {
        this.token = ''
        this.userInfo = null
        removeToken()
        removeUserInfo()
      }
    },
    
    async fetchUserInfo() {
      const res = await fetchUserInfo()
      this.userInfo = res.data
      setUserInfo(res.data)
      return res
    }
  }
})
