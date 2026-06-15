import { mockPrisma, successResponse, errorResponse } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '0')
  if (!id) return errorResponse('无效的客户ID')

  const customer = await mockPrisma.customer.findUnique({ where: { id } })
  if (!customer) return errorResponse('客户不存在', 404)

  const body = await readBody(event)

  if (!body.assigneeId || !body.planDate || !body.planType || !body.content) {
    return errorResponse('缺少必填字段：assigneeId, planDate, planType, content')
  }

  const plan = await mockPrisma.returnPlan.create({
    data: {
      customerId: id,
      assigneeId: body.assigneeId,
      planDate: body.planDate,
      planType: body.planType,
      content: body.content,
    }
  })

  const advisor = await mockPrisma.advisor.findUnique({ where: { id: plan.assigneeId } })

  return successResponse({
    ...plan,
    assignee: advisor || null,
  })
})
