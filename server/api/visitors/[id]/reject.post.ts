import prisma from '~/server/utils/prisma'
import { verifyToken, requireRole } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  requireRole(user, ['OPERATOR', 'ADMIN'])

  const id = parseInt(event.context.params!.id)
  const body = await readBody(event)
  const { reason } = body

  if (!reason) {
    return errorResponse('请填写拒绝原因')
  }

  const visitor = await prisma.visitorAppointment.findUnique({ where: { id } })
  if (!visitor) {
    return errorResponse('访客预约不存在', 404)
  }

  if (visitor.status !== 'PENDING') {
    return errorResponse('此预约状态不允许审核')
  }

  const updated = await prisma.visitorAppointment.update({
    where: { id },
    data: {
      status: 'REJECTED',
      handlerId: user.id,
      rejectReason: reason
    }
  })

  const impactScope = JSON.stringify({
    direct: '访客本人无法进入园区',
    indirect: '被访租户接待计划受阻，可能影响业务洽谈',
    related: '前台登记、安保检查流程需调整'
  })

  await prisma.auditException.create({
    data: {
      sourceType: 'VISITOR',
      sourceId: id,
      title: '访客审核拒绝',
      detail: reason,
      impactScope,
      impactLevel: 'MEDIUM',
      processOrder: 1,
      suggestion: '请联系租户核实情况，如访客需要重新申请，指导其补充完整材料后再次提交。如有特殊紧急情况，可联系上级主管进行特殊审批。'
    }
  })

  return successResponse(updated, '已拒绝')
})
