import { defineConfig } from '@adonisjs/core/app'

export default defineConfig({
  directories: {
    config: 'config',
    public: 'public',
    providers: 'providers',
    start: 'start',
    tests: 'tests',
    tmp: 'tmp',
    database: 'database',
    app: 'app',
  },

  files: {
    env: '.env',
  },

  app: {
    http: {
      basePath: '/',
    },
  },

  assetsBundler: false,

  hooks: {
    onBuildStarting: [],
    onBuildCompleted: [],
    onDevServerStarted: [],
  },
})
