import env from '#start/env'
import { defineConfig } from '@adonisjs/redis'
import { InferConnections } from '@adonisjs/redis/types'

const redisConfig = defineConfig({
  connection: 'main',
  connections: {
    main: {
      host: env.get('REDIS_HOST'),
      port: env.get('REDIS_PORT'),
      password: env.get('REDIS_PASSWORD', ''),
      db: env.get('REDIS_DB', 0),
      username: env.get('REDIS_USERNAME', ''),
      retryStrategy(times) {
        return times > 10 ? null : times * 50
      }
    }
  }
})

export default redisConfig

declare module '@adonisjs/redis/types' {
  interface RedisConnections extends InferConnections<typeof redisConfig> {}
}
