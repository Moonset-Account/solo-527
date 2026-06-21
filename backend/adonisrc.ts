import { defineConfig } from '@adonisjs/core/app'

export default defineConfig({
  directories: {
    config: 'config',
    public: 'public',
    providers: 'providers',
    database: 'database',
    migrations: 'database/migrations',
    seeders: 'database/seeders',
    resources: 'resources',
    views: 'resources/views',
    start: 'start',
    tests: 'tests',
    tmp: 'tmp'
  },

  typescript: {
    outDir: 'build'
  },

  metaFiles: [
    {
      pattern: 'public/**',
      reloadServer: false
    },
    {
      pattern: 'resources/views/**/*.edge',
      reloadServer: false
    },
    {
      pattern: 'start/view.ts',
      reloadServer: true
    },
    {
      pattern: 'start/routes.ts',
      reloadServer: true
    }
  ],

  preloads: [
    () => import('#start/routes')
  ],

  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/core/providers/hash_provider'),
    () => import('@adonisjs/core/providers/vinejs_provider'),
    () => import('@adonisjs/cors/cors_provider'),
    () => import('@adonisjs/lucid/database_provider'),
    () => import('@adonisjs/auth/auth_provider'),
    () => import('@adonisjs/session/session_provider'),
    () => import('@adonisjs/redis/redis_provider'),
    () => import('@adonisjs/vite/vite_provider')
  ],

  commands: [
    () => import('@adonisjs/core/commands'),
    () => import('@adonisjs/lucid/commands'),
    () => import('@adonisjs/redis/commands')
  ],

  tests: {
    suites: [
      {
        name: 'functional',
        files: ['tests/functional/**/*.spec(.ts|.js)'],
        timeout: 30000
      }
    ]
  },

  assetsBundler: {
    enabled: true,
    name: 'vite',
    devServer: {
      command: 'vite',
      args: []
    },
    build: {
      command: 'vite build',
      args: []
    }
  }
})
