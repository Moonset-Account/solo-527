import { defineConfig } from '@adonisjs/static'

const staticServerConfig = defineConfig({
  enabled: true,
  etag: true,
  lastModified: true,
  dotFiles: 'ignore',
  headers: {
    'Cache-Control': 'public, max-age=31536000',
  },
})

export default staticServerConfig
