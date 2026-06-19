import { defineStore } from 'pinia'
import { getToken, setToken, removeToken } from '@/utils/auth'
import request from '@/utils/request'
import router, { resetRouter } from '@/router'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken() || '',
    userInfo: null,
    roles: [],
    permissions: [],
    routes: []
  }),
  actions: {
    async login(loginData) {
      const res = await request.post('/auth/login', loginData)
      this.token = res.token
      this.roles = res.roles || []
      this.permissions = res.permissions || []
      this.userInfo = {
        id: res.userId,
        username: res.username,
        realName: res.realName,
        avatar: res.avatar
      }
      setToken(res.token)
      return res
    },
    async logout() {
      try {
        await request.post('/auth/logout')
      } catch (e) {
        console.error(e)
      }
      this.token = ''
      this.userInfo = null
      this.roles = []
      this.permissions = []
      this.routes = []
      removeToken()
      resetRouter()
      router.push('/login')
    },
    async getUserInfo() {
      const res = await request.get('/auth/userinfo')
      this.userInfo = res
      this.roles = res.roles || []
      this.permissions = res.permissions || []
      return res
    },
    generateRoutes() {
      return this.routes
    }
  }
})
