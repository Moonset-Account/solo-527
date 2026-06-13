export default defineNuxtConfig({
  devtools: { enabled: false },
  compatibilityDate: '2026-06-14',
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    databaseUrl: process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/cs_batch_gen',
    public: {
      apiBase: '/api'
    }
  },
  nitro: {
    experimental: {
      tasks: true
    }
  }
})
