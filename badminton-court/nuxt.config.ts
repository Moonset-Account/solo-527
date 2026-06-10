export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  nitro: {
    plugins: ['~/server/plugins/redis.ts', '~/server/plugins/prisma.ts']
  },
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'badminton-court-secret-key',
    jwtExpiresIn: '7d',
    databaseUrl: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/badminton_court',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    public: {
      siteName: '羽毛球馆预约管理系统'
    }
  },
  css: ['~/assets/css/main.css'],
  typescript: {
    strict: true,
    shim: false
  },
  imports: {
    dirs: ['stores', 'composables']
  },
  app: {
    head: {
      title: '羽毛球馆预约管理系统',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  }
})
