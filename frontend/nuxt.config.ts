import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
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
      include: ['naive-ui', 'vueuc', 'date-fns-tz/formatInTimeZone', 'echarts', 'vue-echarts'],
    },
  },
  imports: {
    dirs: ['composables', 'stores'],
  },
  nitro: {
    devProxy: {
      '/api': {
        target: 'http://localhost:8000/api',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api/, '/api'),
      },
    },
  },
})
