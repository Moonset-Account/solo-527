import { defineConfig } from '@adonisjs/core/app'
import Env from '@adonisjs/core/env'

export default defineConfig({
  appKey: Env.get('APP_KEY'),
  http: {
    allowMethodOverwrite: false,
    cookie: {
      maxAge: '2h',
      domain: '',
      path: '/',
      secure: false,
      httpOnly: true,
      sameSite: false,
    },
    trustProxy: false,
    etag: true,
    cors: {
      enabled: true,
      origin: ['http://localhost:5173'],
      methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
      headers: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
      exposeHeaders: [],
      credentials: true,
      maxAge: 90,
    },
  },
})
