/**
 * Config source: https://git.io/JemcF
 */

import Env from '@ioc:Adonis/Core/Env'

const redisConfig = {
  connection: Env.get('REDIS_CONNECTION', 'local'),

  connections: {
    local: {
      host: Env.get('REDIS_HOST', 'localhost'),
      port: Env.get('REDIS_PORT', '6379'),
      password: Env.get('REDIS_PASSWORD', ''),
      db: 0,
      keyPrefix: '',
    },
  },
}

export default redisConfig
