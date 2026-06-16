import server from '@adonisjs/core/services/server'
import AuthMiddleware from '#middleware/auth_middleware'

server.middleware.register([
  () => import('@adonisjs/core/bodyparser_middleware'),
  () => import('@adonisjs/core/auth_middleware'),
])

server.middleware.registerNamed({
  auth: AuthMiddleware,
})
