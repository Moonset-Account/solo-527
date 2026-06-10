import { defineStore } from 'pinia'
import request from '@/utils/request'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('qinghe_token') || '',
    user: JSON.parse(localStorage.getItem('qinghe_user') || 'null'),
    envInfo: null
  }),
  getters: {
    isAdmin: state => state.user?.role === 'admin',
    isBrandOperator: state => state.user?.role === 'brand_operator',
    isStoreGuide: state => state.user?.role === 'store_guide',
    canManage: state => ['admin', 'brand_operator'].includes(state.user?.role)
  },
  actions: {
    async login(username, password) {
      const res = await request.post('/auth/login', { username, password })
      this.token = res.accessToken
      this.user = res.user
      localStorage.setItem('qinghe_token', res.accessToken)
      localStorage.setItem('qinghe_user', JSON.stringify(res.user))
      return res
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('qinghe_token')
      localStorage.removeItem('qinghe_user')
    },
    async getProfile() {
      try {
        const res = await request.get('/auth/profile')
        this.user = res.user
        localStorage.setItem('qinghe_user', JSON.stringify(res.user))
      } catch (e) {
        console.error(e)
      }
    },
    async getEnvInfo() {
      try {
        const res = await request.get('/env/info')
        this.envInfo = res
      } catch (e) {
        console.error(e)
      }
    }
  }
})
