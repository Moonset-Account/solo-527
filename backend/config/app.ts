import Env from '@ioc:Adonis/Core/Env'
import { AppConfig } from '@ioc:Adonis/Core/Application'

const appConfig: AppConfig = {
  name: '青禾收入结算台',
  version: Env.get('APP_VERSION', '1.0.0'),
  timezone: 'Asia/Shanghai',
  locale: 'zh_CN',
  logger: {
    name: 'qinghe-settlement',
    enabled: true,
    level: Env.get('LOG_LEVEL', 'info'),
    prettyPrint: Env.get('NODE_ENV') === 'development',
    redact: {
      paths: ['password', '*.password'],
    },
  },
  http: {
    logRequests: Env.get('NODE_ENV') !== 'production',
  },
  profiler: {
    enabled: true,
    blacklist: [],
  },
  cache: {
    default: 'redis',
  },
}

export default appConfig
