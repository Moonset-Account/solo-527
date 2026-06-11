export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/beiqiao_inn',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    jwtSecret: process.env.JWT_SECRET || 'beiqiao-inn-dev-secret',
  },
  nitro: {
    preset: 'node-server',
  },
  app: {
    head: {
      title: '北桥房态行程台',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '精品民宿房态库存管理平台' },
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap',
        },
      ],
    },
  },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2026-06-12',
})
