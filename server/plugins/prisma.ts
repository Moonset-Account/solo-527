import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['error', 'warn']
})

export default defineNitroPlugin(() => {
  prisma.$connect().catch((e) => {
    console.error('Failed to connect to database:', e)
  })
})

export { prisma }
