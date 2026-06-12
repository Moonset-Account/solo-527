import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  ssr: false,
  spaLoadingTemplate: false,
  modules: ['@pinia/nuxt', '@vueuse/nuxt'],
  typescript: { strict: false, shim: false },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: '青禾合规清单台',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api',
    },
  },
  build: {
    transpile: ['naive-ui', 'vueuc', '@css-render/vue3-ssr', 'echarts', 'vue-echarts'],
  },
  vite: {
    optimizeDeps: {
      include: ['naive-ui', 'vueuc', 'echarts', 'vue-echarts'],
    },
  },
  imports: {
    dirs: ['composables', 'stores'],
  },
  nitro: {
    preset: 'static',
    devProxy: {
      '/api': {
        target: 'http://localhost:8000/api',
        changeOrigin: true,
      },
    },
  },
})
