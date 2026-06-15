import { mockPrisma, successResponse, errorResponse } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '0')
  if (!id) return errorResponse('无效的客户ID')

  const customer = await mockPrisma.customer.findUnique({ where: { id } })
  if (!customer) return errorResponse('客户不存在', 404)

  const existing = await mockPrisma.churnRecord.findUnique({ where: { customerId: id } })
  if (existing) return errorResponse('该客户已存在流失记录')

  const body = await readBody(event)
  if (!body.reasonCode) return errorResponse('缺少流失原因编码 reasonCode')

  const record = await mockPrisma.churnRecord.create({
    data: {
      customerId: id,
      reasonCode: body.reasonCode,
      reasonDetail: body.reasonDetail || null,
      quotationId: body.quotationId || null,
      churnDate: body.churnDate || new Date().toISOString(),
    }
  })

  return successResponse(record)
})
