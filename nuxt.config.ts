export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  nitro: {
    plugins: ['~/server/plugins/redis.ts', '~/server/plugins/prisma.ts'],
    routeRules: {
      '/api/**': { cors: true }
    }
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/interview_pipeline',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    public: {
      appName: '技术面试管道系统'
    }
  },
  app: {
    head: {
      title: '技术面试管道系统',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },
  typescript: {
    strict: true
  }
})
