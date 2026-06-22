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

  if (!['IMPLEMENTING', 'COMPLETED'].includes(change.status)) {
    throw createError({ statusCode: 400, statusMessage: '当前状态不允许执行回滚' })
  }

  const beforeData = { status: change.status, rolledBackAt: change.rolledBackAt }

  const updated = await prisma.changeRequest.update({
    where: { id },
    data: {
      status: 'ROLLED_BACK',
      rolledBackAt: new Date()
    }
  })

  await prisma.alert.update({
    where: { id: change.alertId },
    data: { status: 'ROLLING_BACK' }
  })

  await createLog({
    actionType: 'ROLLBACK_EXECUTE',
    userId: user.id,
    changeId: id,
    alertId: change.alertId,
    beforeData,
    afterData: { status: updated.status, rolledBackAt: updated.rolledBackAt },
    note: note || '已执行回滚方案'
  })

  await notifyAdmins({
    type: 'alert',
    title: `变更执行回滚: ${change.changeNo}`,
    content: `${user.realName} 对变更 ${change.title} 执行了回滚`,
    changeId: id,
    alertId: change.alertId
  })

  return updated
})
