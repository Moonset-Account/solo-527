import { mockPrisma, successResponse, errorResponse } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '0')
  if (!id) return errorResponse('无效的客户ID')

  const customer = await mockPrisma.customer.findUnique({ where: { id } })
  if (!customer) return errorResponse('客户不存在', 404)

  const body = await readBody(event)

  if (!body.amount || !body.project || !body.consumeDate) {
    return errorResponse('缺少必填字段：amount, project, consumeDate')
  }

  const record = await mockPrisma.consumption.create({
    data: {
      customerId: id,
      amount: String(body.amount),
      project: body.project,
      consumeDate: body.consumeDate,
      operatorId: body.operatorId || null,
    }
  })

  return successResponse(record)
})
