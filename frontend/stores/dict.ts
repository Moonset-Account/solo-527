import { defineStore } from 'pinia'

export const useDictStore = defineStore('dict', {
  state: () => ({
    categories: [] as any[],
    currentCategory: null as string | null,
    items: [] as any[],
    loading: false,
  }),
  actions: {
    async fetchCategories() {
      this.loading = true
      try {
        const api = useApi()
        this.categories = await api.getDictCategories()
      } finally {
        this.loading = false
      }
    },
    async fetchItems(category: string) {
      this.currentCategory = category
      this.loading = true
      try {
        const api = useApi()
        this.items = await api.getDictItems(category)
      } finally {
        this.loading = false
      }
    },
    async addItem(category: string, data: any) {
      const api = useApi()
      const r = await api.addDictItem(category, data)
      await this.fetchItems(category)
      return r
    },
    async deleteItem(category: string, itemKey: string) {
      const api = useApi()
      const r = await api.deleteDictItem(category, itemKey)
      await this.fetchItems(category)
      return r
    },
  },
})
