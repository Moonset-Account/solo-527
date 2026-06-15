import { mockPrisma, successResponse, errorResponse } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '0')
  if (!id) return errorResponse('无效的客户ID')

  const customer = await mockPrisma.customer.findUnique({ where: { id } })
  if (!customer) return errorResponse('客户不存在', 404)

  const body = await readBody(event)

  if (!body.content || !body.consultDate) {
    return errorResponse('缺少必填字段：content, consultDate')
  }

  const record = await mockPrisma.consultRecord.create({
    data: {
      customerId: id,
      content: body.content,
      consultDate: body.consultDate,
      operatorId: body.operatorId || null,
    }
  })

  return successResponse(record)
})
