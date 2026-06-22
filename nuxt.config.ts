export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: [],

  nitro: {
    plugins: ['~/server/plugins/redis.ts', '~/server/plugins/prisma.ts'],
    routeRules: {
      '/api/**': { cors: true }
    }
  },

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'alert-approval-secret-key-change-in-production',
    redis: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || ''
    },
    public: {
      apiBase: '/api'
    }
  },

  typescript: {
    strict: true,
    typeCheck: false
  },

  app: {
    head: {
      title: '服务器告警变更审批系统',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },

  css: ['~/assets/css/main.css']
})
