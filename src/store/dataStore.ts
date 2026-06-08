import { create } from 'zustand'

interface DataStore {
  filterOptions: {
    collectionTypes: string[]
    readerGroups: { key: string; label: string; aggregationOnly: boolean }[]
    themes: string[]
    branches: { id: string; name: string }[]
  } | null
  updatedAt: string | null
  loading: boolean
  error: string | null
  fetchFilterOptions: () => Promise<void>
  fetchUpdateTime: () => Promise<void>
}

export const useDataStore = create<DataStore>((set) => ({
  filterOptions: null,
  updatedAt: null,
  loading: false,
  error: null,
  fetchFilterOptions: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/filter-options')
      const json = await res.json()
      if (json.success) {
        set({ filterOptions: json.data, loading: false })
      } else {
        set({ error: '获取筛选选项失败', loading: false })
      }
    } catch {
      set({ error: '网络错误', loading: false })
    }
  },
  fetchUpdateTime: async () => {
    try {
      const res = await fetch('/api/update-time')
      const json = await res.json()
      if (json.success) {
        set({ updatedAt: json.data.updatedAt })
      }
    } catch {}
  },
}))
