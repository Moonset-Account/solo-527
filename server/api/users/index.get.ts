import { prisma } from '~/server/utils/prisma'
import { handlePrismaError } from '~/server/utils/apiError'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)

    const where: Record<string, unknown> = {}
    if (query.storeId) where.storeId = query.storeId
    if (query.role) where.role = query.role

    const items = await prisma.user.findMany({
      where,
      include: {
        store: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, data: items }
  } catch (error) {
    handlePrismaError(error, '查询用户列表')
  }
})
