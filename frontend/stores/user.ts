import { defineStore } from 'pinia'
import type { UserInfo, Campus } from '~/types'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '' as string,
    user: null as UserInfo | null,
    campuses: [] as Campus[],
    selectedCampusId: null as number | null,
  }),
  getters: {
    isLoggedIn: (state) => !!state.user,
    userRole: (state) => state.user?.role || '',
    isPrincipal: (state) => state.user?.role === 'principal' || state.user?.role === 'admin',
    isTeacher: (state) => state.user?.role === 'teacher',
    isParent: (state) => state.user?.role === 'parent',
    isOperator: (state) => state.user?.role === 'operator',
  },
  actions: {
    setUser(user: UserInfo) {
      this.user = user
    },
    setToken(token: string) {
      this.token = token
    },
    setCampuses(campuses: Campus[]) {
      this.campuses = campuses
      if (!this.selectedCampusId && campuses.length > 0) {
        this.selectedCampusId = campuses[0].id
      }
    },
    setSelectedCampus(id: number) {
      this.selectedCampusId = id
    },
    logout() {
      this.user = null
      this.token = ''
    },
  },
  persist: {
    paths: ['token', 'user', 'selectedCampusId'],
  },
})
