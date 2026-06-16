import prisma from '../../../utils/prisma'

export default defineEventHandler(async () => {
  return prisma.reminderConfig.findMany({
    orderBy: { createdAt: 'desc' }
  })
})
