import Env from '@ioc:Adonis/Core/Env'

const redisConfig = {
  connection: Env.get('REDIS_CONNECTION', 'local'),

  connections: {
    local: {
      host: Env.get('REDIS_HOST'),
      port: Env.get('REDIS_PORT'),
      password: Env.get('REDIS_PASSWORD', ''),
      db: Env.get('REDIS_DB', 0),
      keyPrefix: '',
    },
  },
}

export default redisConfig
