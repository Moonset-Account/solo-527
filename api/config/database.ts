import { defineConfig } from '@adonisjs/lucid'
import Env from '@adonisjs/core/env'

export default defineConfig({
  connection: 'pg',
  connections: {
    pg: {
      client: 'pg',
      connection: {
        host: Env.get('DB_HOST'),
        port: Env.get('DB_PORT'),
        user: Env.get('DB_USER'),
        password: Env.get('DB_PASSWORD'),
        database: Env.get('DB_DATABASE'),
      },
      migrations: {
        naturalSort: true,
        paths: ['./database/migrations'],
      },
      seeders: {
        paths: ['./database/seeders'],
      },
    },
  },
})
