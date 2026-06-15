import { mockPrisma, successResponse, errorResponse } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body.name) return errorResponse('缺少等级名称 name')

  const level = await mockPrisma.customerLevel.create({
    data: {
      name: body.name,
      threshold: String(body.threshold || '0'),
      benefits: body.benefits || null,
      active: body.active !== false,
    }
  })
  return successResponse(level)
})
