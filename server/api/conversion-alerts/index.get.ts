import { prisma } from '~/server/utils/prisma'
import { handlePrismaError } from '~/server/utils/apiError'

export default defineEventHandler(async (event) => {
  try {
    const items = await prisma.conversionAlert.findMany({
      where: { resolved: false },
      include: {
        store: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, data: items }
  } catch (error) {
    handlePrismaError(error, '查询转化率告警')
  }
})
