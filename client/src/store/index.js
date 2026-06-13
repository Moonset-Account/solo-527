import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')) : {
      id: 'u001',
      name: '张三',
      role: 'admin'
    }
  }),
  actions: {
    setUser(user) {
      this.currentUser = user
      localStorage.setItem('currentUser', JSON.stringify(user))
    },
    logout() {
      this.currentUser = null
      localStorage.removeItem('currentUser')
    }
  }
})

export const useDictStore = defineStore('dict', {
  state: () => ({
    dictMap: {}
  }),
  getters: {
    getDictItems: (state) => (code) => state.dictMap[code] || []
  },
  actions: {
    setDictItems(code, items) {
      this.dictMap[code] = items
    }
  }
})
