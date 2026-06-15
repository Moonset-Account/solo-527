import prisma from '~/server/utils/prisma'
import { verifyToken, requireRole } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  requireRole(user, ['OPERATOR', 'ADMIN'])

  const id = parseInt(event.context.params!.id)
  const body = await readBody(event)
  const { materialCost, laborCost, otherCost, costDetails } = body

  const workOrder = await prisma.workOrder.findUnique({ where: { id } })
  if (!workOrder) {
    return errorResponse('工单不存在', 404)
  }

  const matCost = parseFloat(materialCost) || 0
  const labCost = parseFloat(laborCost) || 0
  const othCost = parseFloat(otherCost) || 0
  const totalCost = matCost + labCost + othCost

  const cost = await prisma.workOrderCost.upsert({
    where: { workOrderId: id },
    update: {
      materialCost: matCost,
      laborCost: labCost,
      otherCost: othCost,
      totalCost,
      costDetails,
      operatorId: user.id,
      confirmedAt: new Date()
    },
    create: {
      workOrderId: id,
      materialCost: matCost,
      laborCost: labCost,
      otherCost: othCost,
      totalCost,
      costDetails,
      operatorId: user.id,
      confirmedAt: new Date()
    }
  })

  return successResponse(cost, '费用归集成功')
})
