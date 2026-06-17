export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', 'pinia-plugin-persistedstate/nuxt'],

  ssr: true,

  css: [
    'vfonts/Lato.css',
    'vfonts/FiraCode.css',
    '~/assets/css/main.css',
  ],

  app: {
    head: {
      title: '艺考培训家校沟通站',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '艺考培训家校沟通站 - 服务于校区校长、教师、家长的沟通管理平台' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },

  build: {
    transpile: [
      'naive-ui',
      'vueuc',
      '@css-render/vue3-ssr',
      '@juggle/resize-observer',
    ],
  },

  vite: {
    optimizeDeps: {
      include: [
        'naive-ui',
        'vueuc',
        'date-fns-tz/formatInTimeZone',
        'echarts',
      ],
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1',
      uploadBase: process.env.NUXT_PUBLIC_UPLOAD_BASE || 'http://localhost:8000/uploads',
    },
  },

  nitro: {
    devProxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },

  compatibilityDate: '2024-01-01',
})
