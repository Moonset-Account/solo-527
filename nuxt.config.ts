export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  typescript: { strict: true, typeCheck: false },
  runtimeConfig: {
    mysqlUrl: process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/resident_issue',
    redisHost: process.env.REDIS_HOST || '127.0.0.1',
    redisPort: Number(process.env.REDIS_PORT) || 6379,
    redisPassword: process.env.REDIS_PASSWORD || '',
    public: {
      appName: '居民议题闭环看板',
      pageSize: 20
    }
  },
  app: {
    head: {
      title: '居民议题闭环看板',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '居民议题闭环管理看板系统' }
      ]
    }
  },
  tailwindcss: {
    cssPath: '~/assets/css/main.css'
  },
  nitro: {
    preset: 'node-server',
    experimental: { openAPI: true },
    externals: {
      external: ['@prisma/client', '.prisma/client', 'prisma', 'ioredis']
    },
    rollupConfig: {
      external: ['@prisma/client', '.prisma/client']
    }
  }
})
