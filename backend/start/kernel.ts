/*
|--------------------------------------------------------------------------
| Application middleware
|--------------------------------------------------------------------------
|
| This file is used to define middleware for HTTP requests. You can register
| middleware as a `closure` or an IoC container binding.
|
*/

import Server from '@ioc:Adonis/Core/Server'

Server.middleware.register([
  () => import('@ioc:Adonis/Core/BodyParser'),
  () => import('@ioc:Adonis/Addons/Shield'),
  () => import('App/Middleware/SilentAuth'),
])

Server.middleware.registerNamed({
  auth: () => import('App/Middleware/Auth'),
  guest: () => import('App/Middleware/Guest'),
  role: () => import('App/Middleware/Role'),
  log: () => import('App/Middleware/OperationLog'),
})
