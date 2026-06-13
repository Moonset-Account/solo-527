export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,

  app: {
    head: {
      title: '青禾客服质检台',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'SaaS 客服知识库门户系统' }
      ]
    }
  },

  modules: [
    '@pinia/nuxt',
  ],

  build: {
    transpile: ['naive-ui', 'vueuc', '@css-render/vue3-ssr', '@juggle/resize-observer']
  },

  css: [
    '~/assets/styles/main.scss'
  ],

  vite: {
    optimizeDeps: {
      include: [
        'naive-ui',
        'vueuc',
        'date-fns-tz/esm/formatInTimeZone',
        '@css-render/vue3-ssr'
      ]
    }
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api'
    }
  }
})
