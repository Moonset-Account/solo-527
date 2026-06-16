import { prisma } from '~/server/utils/prisma'
import { handlePrismaError } from '~/server/utils/apiError'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)

    const where: Record<string, unknown> = {}
    if (query.category) where.category = query.category

    const items = await prisma.inspectionTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, data: items }
  } catch (error) {
    handlePrismaError(error, '查询检查模板列表')
  }
})
