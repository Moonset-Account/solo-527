import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { Secret } from '@adonisjs/core/helpers'
import { defineConfig } from '@adonisjs/core/http'

export default defineConfig({
  http: {
    generateRequestId: true,
    allowMethodSpoofing: false,
    useAsyncLocalStorage: false,
    cookie: {
      domain: '',
      path: '/',
      maxAge: '2h',
      httpOnly: true,
      secure: app.inProduction,
      sameSite: 'lax',
    },
  },

  appKey: new Secret(env.get('APP_KEY')),

  appName: env.get('APP_NAME', '家电维修服务系统'),

  version: '1.0.0',

  timezone: env.get('TZ', 'Asia/Shanghai'),

  locale: env.get('APP_LOCALE', 'zh_CN'),

  enabled: true,
})
