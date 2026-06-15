// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],
  typescript: {
    strict: true,
    typeCheck: true
  },
  nitro: {
    experimental: {
      websocket: true
    }
  },
  css: ['~/assets/css/main.scss'],
  runtimeConfig: {
    mysqlUrl: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/park_workorder',
    redisHost: process.env.REDIS_HOST || '127.0.0.1',
    redisPort: parseInt(process.env.REDIS_PORT || '6379'),
    redisPassword: process.env.REDIS_PASSWORD || '',
    jwtSecret: process.env.JWT_SECRET || 'park-workorder-secret-key-2024',
    public: {
      apiBase: '/api'
    }
  },
  app: {
    head: {
      title: '产业园租户报修工单中心',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '园区运营租户报修工单管理系统' }
      ]
    }
  }
})
