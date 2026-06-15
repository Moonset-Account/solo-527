export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/tailwindcss',
  ],
  ui: {
    global: true,
    icons: ['lucide'],
  },
  tailwindcss: {
    cssPath: ['~/assets/css/main.css', { injectPosition: 'first' }],
  },
  colorMode: {
    preference: 'light',
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/dental_crm',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || '',
    },
    sessionSecret: process.env.SESSION_SECRET || 'dental-clinic-super-secret-key',
    public: {
      appName: '牙科诊所客户画像库',
    },
  },
  nitro: {
    storage: {
      cache: {
        driver: 'redis',
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    },
  },
  typescript: {
    strict: true,
    typeCheck: false,
  },
})
