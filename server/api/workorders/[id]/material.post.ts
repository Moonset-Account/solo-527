import prisma from '~/server/utils/prisma'
import { verifyToken, requireRole } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  requireRole(user, ['ENGINEER', 'OPERATOR', 'ADMIN'])

  const id = parseInt(event.context.params!.id)
  const body = await readBody(event)
  const { name, specification, quantity, unit, unitPrice, remark } = body

  if (!name || !quantity || !unit || !unitPrice) {
    return errorResponse('请填写完整材料信息')
  }

  const workOrder = await prisma.workOrder.findUnique({ where: { id } })
  if (!workOrder) {
    return errorResponse('工单不存在', 404)
  }

  const totalPrice = quantity * parseFloat(unitPrice)

  const material = await prisma.workOrderMaterial.create({
    data: {
      workOrderId: id,
      name,
      specification: specification || '',
      quantity,
      unit,
      unitPrice: parseFloat(unitPrice),
      totalPrice,
      operatorId: user.id,
      remark
    }
  })

  await prisma.workOrder.update({
    where: { id },
    data: { status: 'MATERIAL_NEEDED' }
  })

  return successResponse(material, '材料登记成功')
})
