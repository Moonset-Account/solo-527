import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: {
      id: null,
      username: '',
      realName: '',
      role: '',
      department: ''
    }
  }),
  actions: {
    setUser(user) {
      this.currentUser = { ...this.currentUser, ...user }
    },
    clearUser() {
      this.currentUser = {
        id: null,
        username: '',
        realName: '',
        role: '',
        department: ''
      }
    }
  }
})
