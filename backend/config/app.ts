/**
 * Config source: https://git.io/JfefZ
 */

import proxyAddr from 'proxy-addr'
import Env from '@ioc:Adonis/Core/Env'
import type { ServerConfig } from '@ioc:Adonis/Core/Server'
import type { LoggerConfig } from '@ioc:Adonis/Core/Logger'
import type { ProfilerConfig } from '@ioc:Adonis/Core/Profiler'
import type { ValidatorConfig } from '@ioc:Adonis/Core/Validator'

export const appKey = Env.get('APP_KEY')

export const http: ServerConfig = {
  useAsyncLocalStorage: false,
  cookie: {
    domain: '',
    path: '/',
    maxAge: '2h',
    httpOnly: true,
    secure: false,
    sameSite: false,
  },
  trustProxy: proxyAddr.compile('loopback') as any,
  etag: false,
  generateRequestId: false,
  allowMethodSpoofing: false,
  jsonpCallbackName: 'callback',
  cookieClient: false,
}

export const logger: LoggerConfig = {
  name: Env.get('APP_NAME', 'work-order-scheduling'),
  enabled: true,
  level: Env.get('LOG_LEVEL', 'info'),
  prettyPrint: Env.get('NODE_ENV') === 'development',
}

export const profiler: ProfilerConfig = {
  enabled: true,
  blacklist: [],
  whitelist: [],
}

export const validator: ValidatorConfig = {
  bail: false,
}
