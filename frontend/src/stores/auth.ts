import { defineStore } from 'pinia'
import type { User, Teacher, Student, UserRole } from '../types'
import { authAPI } from '../utils/api'

interface AuthState {
  token: string | null
  user: User | null
  teacher: Teacher | null
  student: Student | null
  loading: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('auth_token'),
    user: JSON.parse(localStorage.getItem('current_user') || 'null'),
    teacher: JSON.parse(localStorage.getItem('current_teacher') || 'null'),
    student: JSON.parse(localStorage.getItem('current_student') || 'null'),
    loading: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === UserRole.ADMIN || state.user?.role === UserRole.SUPER_ADMIN,
    isTeacher: (state) => state.user?.role === UserRole.TEACHER,
    isStudent: (state) => state.user?.role === UserRole.STUDENT,
    userId: (state) => state.user?.id
  },

  actions: {
    async login(phone: string, password: string) {
      this.loading = true
      try {
        const response = await authAPI.login({ phone, password })
        this.setAuthData(response)
        return response
      } finally {
        this.loading = false
      }
    },

    async register(name: string, phone: string, password: string, role?: UserRole) {
      this.loading = true
      try {
        const response = await authAPI.register({
          name,
          phone,
          password,
          password_confirmation: password,
          role
        })
        this.setAuthData(response)
        return response
      } finally {
        this.loading = false
      }
    },

    async fetchCurrentUser() {
      try {
        const response = await authAPI.me()
        this.setAuthData(response)
        return response
      } catch (error) {
        this.logout()
        throw error
      }
    },

    setAuthData(data: { token: string; user: User; teacher?: Teacher; student?: Student }) {
      this.token = data.token
      this.user = data.user
      this.teacher = data.teacher || null
      this.student = data.student || null

      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('current_user', JSON.stringify(data.user))
      if (data.teacher) {
        localStorage.setItem('current_teacher', JSON.stringify(data.teacher))
      }
      if (data.student) {
        localStorage.setItem('current_student', JSON.stringify(data.student))
      }
    },

    logout() {
      this.token = null
      this.user = null
      this.teacher = null
      this.student = null

      localStorage.removeItem('auth_token')
      localStorage.removeItem('current_user')
      localStorage.removeItem('current_teacher')
      localStorage.removeItem('current_student')
    },

    hasRole(...roles: UserRole[]): boolean {
      if (!this.user) return false
      return roles.includes(this.user.role)
    }
  }
})
