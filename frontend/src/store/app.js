import { create } from 'zustand'

const useAppStore = create((set) => ({
  collapsed: false,
  loading: false,
  theme: 'light',
  language: 'zh-CN',
  breadcrumb: [],

  toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),

  setCollapsed: (collapsed) => set({ collapsed }),

  setLoading: (loading) => set({ loading }),

  setTheme: (theme) => set({ theme }),

  setLanguage: (language) => set({ language }),

  setBreadcrumb: (breadcrumb) => set({ breadcrumb })
}))

export default useAppStore
