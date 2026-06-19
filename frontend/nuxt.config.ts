export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: '心理咨询排班管理系统',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:8001'
    }
  },
  vite: {
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8001',
          changeOrigin: true
        }
      }
    },
    optimizeDeps: {
      include: ['naive-ui', 'vueuc', 'date-fns-tz/esm/formatInTimeZone']
    }
  },
  typescript: {
    strict: false
  }
})
