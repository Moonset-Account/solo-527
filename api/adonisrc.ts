import { defineConfig } from '@adonisjs/core/app'

export default defineConfig({
  rcDirectory: '.',
  directories: {
    commands: './app/commands',
    controllers: './app/controllers',
    exceptions: './app/exceptions',
    middleware: './app/middleware',
    models: './app/models',
    providers: './app/providers',
    services: './app/services',
    validators: './app/validators',
    views: './resources/views',
  },
  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/core/providers/hash_provider'),
    () => import('@adonisjs/core/providers/vinejs_provider'),
    () => import('@adonisjs/auth/auth_provider'),
    () => import('@adonisjs/lucid/db_provider'),
    () => import('@adonisjs/drive/drive_provider'),
  ],
  preloads: [
    () => import('./start/routes'),
    () => import('./start/kernel'),
  ],
  commands: [
    () => import('@adonisjs/core/commands'),
    () => import('@adonisjs/lucid/commands'),
  ],
})
