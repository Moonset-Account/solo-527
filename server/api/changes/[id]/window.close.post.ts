import { prisma } from '../../../plugins/prisma'
import { requireAuth } from '../../../utils/auth'
import { createLog } from '../../../utils/logger'
import { notifyAdmins } from '../../../utils/notification'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = parseInt(getRouterParam(event, 'id') || '0')
  const body = await readBody(event)
  const { note } = body

  const change = await prisma.changeRequest.findUnique({ where: { id } })
  if (!change) {
    throw createError({ statusCode: 404, statusMessage: '变更申请不存在' })
  }

  if (change.status !== 'IMPLEMENTING') {
    throw createError({ statusCode: 400, statusMessage: '只有执行中的变更可以关闭窗口' })
  }

  const beforeData = { status: change.status, windowClosedAt: change.windowClosedAt, completedAt: change.completedAt }

  const updated = await prisma.changeRequest.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      windowClosedAt: new Date(),
      completedAt: new Date()
    }
  })

  await prisma.alert.update({
    where: { id: change.alertId },
    data: { status: 'COMPLETED', resolvedAt: new Date(), resolveNote: note || '通过变更恢复' }
  })

  await createLog({
    actionType: 'CHANGE_WINDOW_CLOSE',
    userId: user.id,
    changeId: id,
    alertId: change.alertId,
    beforeData,
    afterData: { status: updated.status, windowClosedAt: updated.windowClosedAt, completedAt: updated.completedAt },
    note: note || '变更完成，窗口已关闭'
  })

  await notifyAdmins({
    type: 'approval',
    title: `变更已完成: ${change.changeNo}`,
    content: `${user.realName} 已完成变更并关闭窗口: ${change.title}`,
    changeId: id,
    alertId: change.alertId
  })

  return updated
})
