import prisma from '~/server/utils/prisma'
import { verifyToken } from '~/server/utils/auth'
import { successResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  const query = getQuery(event)
  const pageKey = query.pageKey as string

  const where: any = {
    userId: user.id
  }

  if (pageKey) {
    where.pageKey = pageKey
  }

  const presets = await prisma.filterPreset.findMany({
    where,
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' }
    ]
  })

  const result = presets.map(p => ({
    ...p,
    filters: JSON.parse(p.filters)
  }))

  return successResponse(result)
})
