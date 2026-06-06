export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  runtimeConfig: {
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/waste-supervision',
    jwtSecret: process.env.JWT_SECRET || 'waste-supervision-secret-key-2024',
    public: {
      mapboxToken: process.env.MAPBOX_TOKEN || '',
      taskDeadlineHours: process.env.TASK_DEADLINE_HOURS || '24',
    }
  },
  nitro: {
    plugins: ['~/server/plugins/mongodb.ts']
  },
  css: ['~/assets/css/main.css'],
  colorMode: {
    preference: 'light'
  },
  ui: {
    icons: ['heroicons', 'lucide']
  }
})
