import { prisma, ensurePrismaReady } from '../utils/prisma'
import { ok } from '../utils/response'

export default defineEventHandler(async () => {
  const prismaStatus = await ensurePrismaReady()
  return ok({
    status: 'ok',
    timestamp: new Date().toISOString(),
    prisma: prismaStatus.ok ? 'connected' : 'disconnected',
    prismaError: prismaStatus.error || null,
    version: process.env.npm_package_version || '1.0.0'
  })
})
