import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  devtools: { enabled: true },
  app: {
    head: {
      title: '医药批次追溯系统',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '医药批次追溯管理系统 - 采购计划员专用' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },
  modules: [
    '@pinia/nuxt'
  ],
  pinia: {
    storesDirs: ['./stores/**']
  },
  css: [
    '~/assets/css/main.scss'
  ],
  build: {
    transpile: [
      'naive-ui',
      'vueuc',
      '@css-render/vue3-ssr',
      '@juggle/resize-observer',
      'echarts',
      'vue-echarts'
    ]
  },
  vite: {
    optimizeDeps: {
      include: [
        'naive-ui',
        'vueuc',
        'date-fns-tz/esm/formatInTimeZone',
        'echarts',
        'vue-echarts'
      ]
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path: string) => path
        }
      }
    }
  },
  routeRules: {
    '/**': { ssr: false }
  },
  typescript: {
    shim: false,
    strict: false
  },
  runtimeConfig: {
    public: {
      apiBase: '/api/v1'
    }
  }
})
