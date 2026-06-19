export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],
  css: [
    '~/assets/css/main.css',
  ],
  app: {
    head: {
      title: '施工验收台',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '设计图纸现场巡检管理系统' },
      ],
    },
    pageTransition: { name: 'fade', mode: 'out-in' },
    layoutTransition: { name: 'fade', mode: 'out-in' },
  },
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'default-secret-key-change-in-production',
    databaseUrl: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/inspection_db',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    public: {
      apiBase: '/api',
    },
  },
  nitro: {
    storage: {
      uploads: {
        driver: 'fs',
        base: './public/uploads',
      },
    },
  },
  imports: {
    dirs: ['stores', 'composables'],
  },
  components: [
    { path: '~/components', pathPrefix: false },
  ],
})
