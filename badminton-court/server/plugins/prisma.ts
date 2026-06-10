import { Nitro } from 'nitropack'
import prisma from '../utils/prisma'

export default async (_nitroApp: Nitro) => {
  console.log('[Nitro] Connecting to database...')
  try {
    await prisma.$connect()
    console.log('[Nitro] Database connected successfully')
  } catch (error) {
    console.error('[Nitro] Database connection failed:', error)
  }
}
