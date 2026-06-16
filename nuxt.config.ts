export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  tailwindcss: {
    configPath: '~/tailwind.config.ts',
  },
  runtimeConfig: {
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    databaseUrl: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/carwash',
    public: {
      apiBase: '/api',
    },
  },
  css: ['~/assets/css/main.css'],
})
