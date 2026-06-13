export default [
  '@adonisjs/core/providers/app_provider',
  '@adonisjs/core/providers/hash_provider',
  '@adonisjs/validator/providers/validator_provider',
  '@adonisjs/cors/cors_provider',
  '@adonisjs/lucid/database_provider',
  '@adonisjs/auth/auth_provider',
  '@adonisjs/redis/redis_provider',
] as const
