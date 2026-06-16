export default defineNitroPlugin(async (_nitroApp) => {
  try {
    const prisma = await import('../utils/prisma').then(m => m.default)
    await prisma.$connect()
    console.log('[Prisma] Database connected successfully')
  } catch (error) {
    console.error('[Prisma] Database connection failed:', error)
  }
})
