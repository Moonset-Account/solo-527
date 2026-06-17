// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  app: {
    head: {
      title: '合同审查审阅流系统',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '面向法务负责人的合同审查审阅流程管理系统' }
      ]
    }
  },

  modules: [
    '@pinia/nuxt'
  ],

  pinia: {
    autoImports: ['defineStore', 'storeToRefs']
  },

  imports: {
    dirs: ['./stores']
  },

  nitro: {
    plugins: ['~/server/plugins/prisma.ts', '~/server/plugins/redis.ts']
  },

  runtimeConfig: {
    DATABASE_URL: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/contract_review',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    public: {
      apiBase: '/api'
    }
  },

  typescript: {
    strict: true,
    shim: false
  },

  css: ['~/assets/css/main.css']
})
