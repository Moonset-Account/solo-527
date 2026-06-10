/**
 * Config source: https://git.io/JfefC
 */

import type { CorsConfig } from '@ioc:Adonis/Core/Cors'

const corsConfig: CorsConfig = {
  enabled: true,
  origin: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH'],
  headers: true,
  exposeHeaders: [
    'content-type',
    'authorization',
    'x-auth-token',
  ],
  credentials: true,
  maxAge: 90,
}

export default corsConfig
