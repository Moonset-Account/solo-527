import { defineStore } from 'pinia'

export const useRuleStore = defineStore('rule', {
  state: () => ({
    rules: [] as any[],
    loading: false,
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
    async updateRule(id: string | number, data: any) {
      const api = useApi()
      const r = await api.updateRule(id, data)
      await this.fetchRules()
      return r
    },
  },
})
