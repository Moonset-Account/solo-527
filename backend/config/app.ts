import Env from '@ioc:Adonis/Core/Env'
import { AppConfig } from '@ioc:Adonis/Core/Application'

const appConfig: AppConfig = {
  name: '青禾收入结算台',
  version: Env.get('APP_VERSION', '1.0.0'),
  appKey: Env.get('APP_KEY'),
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
    cookie: {
      client: false,
    },
    trustProxy: () => Env.get('NODE_ENV') === 'production',
    subdomainOffset: 2,
    generateRequestId: true,
    etag: false,
    jsonpCallbackName: 'callback',
    forceContentNegotiationTo: 'application/json',
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
