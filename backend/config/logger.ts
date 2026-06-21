import { defineConfig, targets, transports } from '@adonisjs/core/logger'
import app from '@adonisjs/core/services/app'
import env from '#start/env'

const loggerConfig = defineConfig({
  default: 'app',
  loggers: {
    app: {
      level: env.get('LOG_LEVEL', 'info'),
      transport: app.inEnvironment('production') ? transports.targets() : transports.pretty({
        colorize: true,
        ignore: 'pid,hostname'
      }),
      redact: {
        paths: ['password', '*.password'],
        censor: '[REDACTED]'
      }
    }
  }
})

export default loggerConfig
