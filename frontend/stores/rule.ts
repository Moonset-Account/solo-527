import { defineStore } from 'pinia'

export const useRuleStore = defineStore('rule', {
  state: () => ({
    rules: [] as any[],
    loading: false
  }),
  actions: {
    async fetchRules() {
      this.loading = true
      try {
        const api = useApi()
        this.rules = await api.getRules()
      } finally {
        this.loading = false
      }
    },
    async updateRule(id: string, data: any) {
      const api = useApi()
      const result = await api.updateRule(id, data)
      if (result) {
        const idx = this.rules.findIndex(r => r.id === id)
        if (idx >= 0) this.rules[idx] = result
      }
      return result
    }
  }
})
