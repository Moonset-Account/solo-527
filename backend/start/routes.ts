/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file.
|
*/

import Route from '@ioc:Adonis/Core/Route'

Route.get('/', async () => {
  return { app: 'work-order-scheduling', version: '1.0.0' }
})

import './routes/auth'
import './routes/users'
import './routes/work_orders'
import './routes/schedules'
import './routes/materials'
import './routes/reworks'
import './routes/productions'
import './routes/risks'
import './routes/logs'
