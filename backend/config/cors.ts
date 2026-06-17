import { defineConfig } from '@adonisjs/cors'
import env from '#start/env'

const corsOrigin = env.get('CORS_ORIGIN', '*')
const originList = corsOrigin.split(',').map((o) => o.trim())

const corsConfig = defineConfig({
  enabled: true,
  origin: (origin: string) => {
    if (corsOrigin === '*') return true
    if (!origin) return false
    return originList.includes(origin)
  },
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  headers: true,
  exposeHeaders: [
    'x-total-count',
    'x-page',
    'x-per-page',
  ],
  credentials: true,
  maxAge: 90,
})

export default corsConfig
