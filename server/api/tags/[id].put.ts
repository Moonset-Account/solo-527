import { mockPrisma, successResponse, errorResponse } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '0')
  if (!id) return errorResponse('无效的标签ID')

  const body = await readBody(event)
  const updated = await mockPrisma.tag.update({ where: { id }, data: body })
  if (!updated) return errorResponse('标签不存在', 404)

  return successResponse(updated)
})
