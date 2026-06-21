export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  build: {
    transpile: ['naive-ui', 'vueuc', 'css-render']
  },
  vite: {
    ssr: {
      noExternal: ['naive-ui', 'vueuc', 'date-fns', 'css-render']
    },
    server: {
      proxy: {
        '/api': {
          target: process.env.BACKEND_URL || 'http://localhost:8000',
          changeOrigin: true
        }
      }
    }
  },
  css: [
    '~/assets/css/main.scss'
  ],
  app: {
    head: {
      title: '烘焙门店巡店整改系统',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      apiBase: '/api'
    }
  }
})
