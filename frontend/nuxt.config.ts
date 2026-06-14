export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  modules: [
    '@bg-dev/nuxt-naiveui',
    '@pinia/nuxt',
  ],

  naiveui: {
    colorModePreference: 'light',
    themeConfig: {},
  },

  pinia: {
    storesDirs: ['./app/stores/**'],
  },

  app: {
    head: {
      title: '装修巡检系统',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '装修巡检系统 - 装修质量巡检管理平台' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },

  routeRules: {
    '/api/**': { proxy: 'http://localhost:8000/api/**' },
  },

  nitro: {
    devProxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },

  future: {
    compatibilityVersion: 4,
  },
})
