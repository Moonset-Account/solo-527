export default defineNuxtConfig({
  modules: [],
  runtimeConfig: {
    public: {
      API_BASE: 'http://localhost:8000'
    }
  },
  css: [],
  vite: {
    optimizeDeps: {
      include: [
        'naive-ui',
        'naive-ui/es/icon',
        '@vicons/ionicons5'
      ]
    }
  }
})
