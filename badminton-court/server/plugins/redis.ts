import { Nitro } from 'nitropack'
import redis from '../utils/redis'

export default async (_nitroApp: Nitro) => {
  console.log('[Nitro] Connecting to Redis...')
  try {
    await redis.ping()
    console.log('[Nitro] Redis connected successfully')
  } catch (error) {
    console.warn('[Nitro] Redis connection warning (continuing without cache):', error)
  }
}
