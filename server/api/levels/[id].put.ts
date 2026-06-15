import { mockPrisma, successResponse, errorResponse } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '0')
  if (!id) return errorResponse('无效的等级ID')

  const body = await readBody(event)
  const data: any = { ...body }
  if (body.threshold !== undefined) data.threshold = String(body.threshold)

  const updated = await mockPrisma.customerLevel.update({ where: { id }, data })
  if (!updated) return errorResponse('等级不存在', 404)

  return successResponse(updated)
})
