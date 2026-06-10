export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [],
  srcDir: '.',
  nitro: {
    plugins: ['~/server/plugins/prisma.ts', '~/server/plugins/redis.ts'],
    routeRules: {
      '/api/**': { cors: true }
    }
  },
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'qinghe-jwt-secret-key-2026',
    redis: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || '',
      db: parseInt(process.env.REDIS_DB || '0')
    },
    public: {
      appName: '青禾配送时效台',
      apiBase: '/api'
    }
  },
  typescript: {
    strict: true,
    shim: false,
    typeCheck: false
  },
  css: ['@/assets/scss/main.scss'],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/scss/variables.scss" as *;'
        }
      }
    }
  }
})
