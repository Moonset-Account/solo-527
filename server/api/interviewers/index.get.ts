import prisma from '../../../utils/prisma'

export default defineEventHandler(async () => {
  return prisma.interviewer.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  })
})
