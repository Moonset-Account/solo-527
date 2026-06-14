import Env from '@ioc:Adonis/Core/Env'
import { RedisConfig } from '@ioc:Adonis/Addons/Redis'

const redisConfig: RedisConfig = {
  connection: Env.get('REDIS_CONNECTION', 'local'),
  connections: {
    local: {
      host: Env.get('REDIS_HOST', '127.0.0.1'),
      port: Env.get('REDIS_PORT', '6379'),
      password: Env.get('REDIS_PASSWORD', ''),
      db: 0,
      keyPrefix: 'qinghe_',
    },
  },
}

export default redisConfig
