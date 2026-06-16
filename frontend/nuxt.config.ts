import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  modules: ['@pinia/nuxt'],
  css: [
    'naive-ui/dist/styles/light.css'
  ],
  build: {
    transpile: ['naive-ui', 'vueuc', '@css-render/vue3-ssr', '@juggle/resize-observer']
  },
  vite: {
    optimizeDeps: {
      include: [
        'naive-ui',
        'vueuc',
        '@css-render/vue3-ssr',
        '@juggle/resize-observer',
        'date-fns-tz/esm/formatInTimeZone'
      ]
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true
        }
      }
    }
  },
  app: {
    head: {
      title: '办公耗材询价比价平台',
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
