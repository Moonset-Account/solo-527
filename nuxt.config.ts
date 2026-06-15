// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  css: [
    '~/assets/css/main.css'
  ],
  app: {
    head: {
      title: '销售经营权限数据门户',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap', rel: 'stylesheet' }
      ]
    },
    pageTransition: { name: 'page', mode: 'out-in' }
  },
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'sales-portal-secret-key',
    databaseUrl: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/sales_portal',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    public: {
      apiBase: '/api'
    }
  },
  nitro: {
    routeRules: {
      '/api/**': { cors: true }
    }
  },
  typescript: {
    strict: true,
    typeCheck: false
  },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },
  tailwindcss: {
    cssPath: ['~/assets/css/main.css', { injectPosition: 'first' }],
    configPath: 'tailwind.config.js',
    viewer: false
  }
})
