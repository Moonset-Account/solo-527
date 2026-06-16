import env from '#start/env'
import { defineConfig } from '@adonisjs/redis'

const redisConfig = defineConfig({
  connection: 'main',

  connections: {
    main: {
      host: env.get('REDIS_HOST', 'localhost'),
      port: env.get('REDIS_PORT', 6379),
      password: env.get('REDIS_PASSWORD', ''),
      db: 0,
      keyPrefix: '',
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: true,
    },
  },
})

export default redisConfig
