import Redis from '@ioc:Adonis/Addons/Redis'
import Logger from '@ioc:Adonis/Core/Logger'

Redis.connection().on('connect', () => {
  Logger.info('Redis connected successfully')
})

Redis.connection().on('error', (error) => {
  Logger.error('Redis connection error:', error.message)
})
