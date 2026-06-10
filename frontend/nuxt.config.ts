export default defineNuxtConfig({
  devtools: { enabled: true },
  typescript: {
    strict: true,
    typeCheck: false,
  },
  modules: [
    '@pinia/nuxt',
  ],
  css: [
    'vfonts/Lato.css',
    'vfonts/FiraCode.css',
  ],
  build: {
    transpile: ['naive-ui', 'vueuc', '@css-render/vue3-ssr'],
  },
  vite: {
    define: {
      'process.env': process.env,
    },
    optimizeDeps: {
      include: ['naive-ui'],
    },
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:8000/api/v1',
    },
  },
  app: {
    head: {
      title: '青禾候选人管道台',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '青禾校招候选人管道管理系统' },
      ],
    },
  },
})
