import Server from '@ioc:Adonis/Core/Server'

Server.middleware.register([
  () => import('@ioc:Adonis/Core/BodyParserMiddleware'),
  () => import('App/Middleware/ForceJsonResponse'),
])

Server.middleware.registerNamed({
  auth: () => import('App/Middleware/Auth'),
  admin: () => import('App/Middleware/Admin'),
  silentAuth: () => import('App/Middleware/SilentAuth'),
})
