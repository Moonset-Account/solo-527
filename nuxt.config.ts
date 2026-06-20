export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: [],
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/tcm_clinic',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    public: {
      appName: '中医馆疗程管理器'
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
  }
})
