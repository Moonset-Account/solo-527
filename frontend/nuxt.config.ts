export default defineNuxtConfig({
  devtools: { enabled: false },

  modules: [
    '@nuxtjs/tailwindcss',
  ],

  app: {
    head: {
      title: 'IT账号变更审批系统',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },

  css: [
    'vfonts/Lato.css',
    'vfonts/FiraCode.css',
  ],

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:8000/api/v1',
    },
  },

  ssr: false,

  build: {
    transpile: ['naive-ui', 'vueuc', 'vdirs', 'evtd'],
  },

  imports: {
    dirs: ['stores'],
  },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
})
