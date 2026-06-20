import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrisma() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['error', 'warn']
  })
  client.$on('beforeExit' as any, () => {
    console.log('[prisma] disconnecting...')
  })
  return client
}

export const prisma = globalForPrisma.prisma || createPrisma()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function ensurePrismaReady(): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) }
  }
}
