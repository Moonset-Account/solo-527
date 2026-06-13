import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient | undefined

export function useDB() {
  if (!prisma) {
    prisma = new PrismaClient()
  }
  return prisma
}
