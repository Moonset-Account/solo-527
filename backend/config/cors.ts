import { CorsConfig } from '@ioc:Adonis/Core/Cors'

const corsConfig: CorsConfig = {
  enabled: true,
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
  headers: true,
  exposeHeaders: [
    'content-type',
    'content-length',
  ],
  credentials: true,
  maxAge: 90,
}

export default corsConfig
