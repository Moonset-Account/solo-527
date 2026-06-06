import { defineStore } from 'pinia'
import request from '@/utils/request'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null')
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    userRole: (state) => state.user?.role || '',
    isAdmin: (state) => state.user?.role === 'admin',
    isCoach: (state) => state.user?.role === 'coach' || state.user?.role === 'admin',
    isRunner: (state) => state.user?.role === 'runner' || state.user?.role === 'coach' || state.user?.role === 'admin',
    userName: (state) => state.user?.full_name || state.user?.username || ''
  },
  actions: {
    async login(username, password) {
      const formData = new FormData()
      formData.append('username', username)
      formData.append('password', password)
      const data = await request.post('/auth/login', formData)
      this.token = data.access_token
      this.user = data.user
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      return data
    },
    async register(userData) {
      const data = await request.post('/auth/register', userData)
      return data
    },
    async getCurrentUser() {
      const data = await request.get('/auth/me')
      this.user = data
      localStorage.setItem('user', JSON.stringify(data))
      return data
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    hasPermission(module, action) {
      const permissions = {
        admin: {
          users: ['create', 'read', 'update', 'delete'],
          training_plans: ['create', 'read', 'update', 'delete', 'publish'],
          checkins: ['create', 'read', 'update', 'delete', 'review'],
          activities: ['create', 'read', 'update', 'delete', 'publish'],
          activity_signups: ['read', 'update', 'delete'],
          injury_notes: ['create', 'read', 'update', 'delete'],
          tasks: ['create', 'read', 'update', 'delete'],
          pace_analysis: ['read', 'create']
        },
        coach: {
          users: ['read'],
          training_plans: ['create', 'read', 'update', 'publish'],
          checkins: ['create', 'read', 'update', 'review'],
          activities: ['create', 'read', 'update', 'publish'],
          activity_signups: ['read', 'update'],
          injury_notes: ['create', 'read', 'update'],
          tasks: ['create', 'read', 'update'],
          pace_analysis: ['read', 'create']
        },
        runner: {
          users: ['read', 'update_self'],
          training_plans: ['read'],
          checkins: ['create', 'read_self', 'update_self'],
          activities: ['read'],
          activity_signups: ['create', 'read_self', 'update_self'],
          injury_notes: [],
          tasks: ['read_self', 'update_self'],
          pace_analysis: ['read_self']
        }
      }
      const role = this.user?.role
      if (!role) return false
      const rolePerms = permissions[role]
      if (!rolePerms) return false
      const modulePerms = rolePerms[module]
      if (!modulePerms) return false
      return modulePerms.includes(action)
    }
  }
})
