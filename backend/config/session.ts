import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, stores } from '@adonisjs/session'

const sessionConfig = defineConfig({
  enabled: true,
  cookieName: 'appliance_repair_session',
  clearWithBrowser: false,
  age: '2h',
  cookie: {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: app.inProduction,
    maxAge: '2h',
  },
  store: env.get('SESSION_DRIVER', 'cookie'),
  stores: {
    cookie: stores.cookie(),
    redis: stores.redis({
      connectionName: 'local',
    }),
  },
})

export default sessionConfig
