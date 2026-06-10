import { PrismaClient } from '~/app/generated/prisma'

let prisma: PrismaClient

declare module 'nitropack' {
  interface NitroApp {
    prisma: PrismaClient
  }
}

export default defineNitroPlugin((nitroApp) => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['error', 'warn'],
    })
  }
  nitroApp.prisma = prisma
})

export function usePrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['error', 'warn'],
    })
  }
  return prisma
}
