import { mockPrisma, successResponse, errorResponse } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body.name) return errorResponse('缺少标签名称 name')

  const tag = await mockPrisma.tag.create({
    data: {
      name: body.name,
      color: body.color || '#0EA5A9',
      active: body.active !== false,
    }
  })
  return successResponse(tag)
})
