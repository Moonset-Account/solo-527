export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],
  css: [],
  app: {
    head: {
      title: '网格事件闭环看板',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '网格事件闭环管理系统' }
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap'
        }
      ],
      style: [
        { children: 'body { font-family: "Noto Sans SC", sans-serif; }' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      apiBase: '/api'
    }
  },
  vite: {
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true
        }
      }
    }
  }
})
