import { prisma } from '../../../plugins/prisma'
import { requireAdmin } from '../../../utils/auth'
import { createLog } from '../../../utils/logger'
import { createNotification } from '../../../utils/notification'

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)
  const id = parseInt(getRouterParam(event, 'id') || '0')
  const body = await readBody(event)
  const { reason } = body

  if (!reason) {
    throw createError({ statusCode: 400, statusMessage: '必须填写异常原因' })
  }

  const change = await prisma.changeRequest.findUnique({ where: { id } })
  if (!change) {
    throw createError({ statusCode: 404, statusMessage: '变更申请不存在' })
  }

  const endStatuses = ['COMPLETED', 'ROLLED_BACK', 'ABNORMAL_ENDED', 'REJECTED', 'CANCELLED']
  if (endStatuses.includes(change.status)) {
    throw createError({ statusCode: 400, statusMessage: '已结束的变更不能标记异常' })
  }

  const beforeData = { status: change.status, abnormalReason: change.abnormalReason }

  const updated = await prisma.changeRequest.update({
    where: { id },
    data: {
      status: 'ABNORMAL_ENDED',
      abnormalReason: reason
    }
  })

  await createLog({
    actionType: 'ABNORMAL_END',
    userId: user.id,
    changeId: id,
    alertId: change.alertId,
    beforeData,
    afterData: { status: updated.status, abnormalReason: updated.abnormalReason },
    note: reason
  })

  await createNotification({
    userId: change.submitterId,
    type: 'alert',
    title: `变更异常结束: ${change.changeNo}`,
    content: `${user.realName} 将变更标记为异常结束: ${reason}`,
    changeId: id,
    alertId: change.alertId
  })

  return updated
})
