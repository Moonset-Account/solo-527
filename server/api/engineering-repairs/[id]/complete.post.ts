import prisma from '~/server/utils/prisma'
import { verifyToken, requireRole } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  requireRole(user, ['ENGINEER', 'OPERATOR', 'ADMIN'])

  const id = parseInt(event.context.params!.id)
  const body = await readBody(event)
  const { result, actualCost, maintenanceHours, remark } = body

  const repair = await prisma.engineeringRepair.findUnique({ where: { id } })
  if (!repair) {
    return errorResponse('工程报修不存在', 404)
  }

  if (repair.status === 'COMPLETED') {
    return errorResponse('工程报修已完成，无法重复完成')
  }

  if (repair.status === 'CANCELLED') {
    return errorResponse('工程报修已取消，无法完成')
  }

  const updated = await prisma.engineeringRepair.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      actualDate: new Date(),
      actualCost: actualCost ? parseFloat(actualCost) : null,
      maintenanceHours: maintenanceHours ? parseFloat(maintenanceHours) : null,
      result,
      remark: remark || repair.remark
    }
  })

  return successResponse(updated, '工程报修完成')
})
