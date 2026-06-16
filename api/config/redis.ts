import Env from '@adonisjs/core/env'

const redisConfig = {
  connection: 'main',
  connections: {
    main: {
      host: Env.get('REDIS_HOST', '127.0.0.1'),
      port: Env.get('REDIS_PORT', 6379),
      password: Env.get('REDIS_PASSWORD', ''),
      db: Env.get('REDIS_DB', 0),
      keyPrefix: Env.get('CACHE_PREFIX', 'nail_salon'),
    },
  },
}

export default redisConfig

export type RedisConfig = typeof redisConfig
