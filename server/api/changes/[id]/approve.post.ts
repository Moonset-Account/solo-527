import { prisma } from '../../../plugins/prisma'
import { requireAdmin } from '../../../utils/auth'
import { createLog, diffChanges } from '../../../utils/logger'
import { createNotification } from '../../../utils/notification'

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)
  const id = parseInt(getRouterParam(event, 'id') || '0')
  const body = await readBody(event)
  const { approved, approvalNote } = body

  const change = await prisma.changeRequest.findUnique({ where: { id } })
  if (!change) {
    throw createError({ statusCode: 404, statusMessage: '变更申请不存在' })
  }

  if (change.status !== 'PENDING') {
    throw createError({ statusCode: 400, statusMessage: '当前状态不允许审批' })
  }

  const beforeData = { status: change.status, approverId: change.approverId, approvedAt: change.approvedAt, approvalNote: change.approvalNote }
  const newStatus = approved ? 'APPROVED' : 'REJECTED'

  const updated = await prisma.changeRequest.update({
    where: { id },
    data: {
      status: newStatus,
      approverId: user.id,
      approvedAt: new Date(),
      approvalNote: approvalNote || ''
    }
  })

  const afterData = { status: updated.status, approverId: updated.approverId, approvedAt: updated.approvedAt, approvalNote: updated.approvalNote }
  const { beforeData: diffBefore, afterData: diffAfter } = diffChanges(
    beforeData as Record<string, unknown>,
    afterData as Record<string, unknown>
  )

  await createLog({
    actionType: approved ? 'CHANGE_REQUEST_APPROVE' : 'CHANGE_REQUEST_REJECT',
    userId: user.id,
    changeId: id,
    alertId: change.alertId,
    beforeData: diffBefore,
    afterData: diffAfter,
    note: approvalNote || (approved ? '变更申请已批准' : '变更申请已驳回')
  })

  await createNotification({
    userId: change.submitterId,
    type: 'approval',
    title: `变更申请已${approved ? '批准' : '驳回'}: ${change.changeNo}`,
    content: `${user.realName} 已${approved ? '批准' : '驳回'}您的变更申请: ${change.title}`,
    changeId: id,
    alertId: change.alertId
  })

  return updated
})
