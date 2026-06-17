import { defineConfig } from '@adonisjs/redis'
import env from '#start/env'

const redisConfig = defineConfig({
  connection: env.get('REDIS_CONNECTION', 'local'),
  connections: {
    local: {
      host: env.get('REDIS_HOST', '127.0.0.1'),
      port: env.get('REDIS_PORT', 6379),
      password: env.get('REDIS_PASSWORD', ''),
      db: 0,
      keyPrefix: '',
      retryStrategy(times) {
        return Math.min(times * 50, 2000)
      },
    },
  },
})

export default redisConfig
