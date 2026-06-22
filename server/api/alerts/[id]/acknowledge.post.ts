import { prisma } from '../../../plugins/prisma'
import { requireAuth } from '../../../utils/auth'
import { createLog } from '../../../utils/logger'
import { createNotification } from '../../../utils/notification'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = parseInt(getRouterParam(event, 'id') || '0')
  const body = await readBody(event)
  const { note } = body

  const alert = await prisma.alert.findUnique({ where: { id } })
  if (!alert) {
    throw createError({ statusCode: 404, statusMessage: '告警不存在' })
  }

  if (alert.status !== 'PENDING') {
    throw createError({ statusCode: 400, statusMessage: '当前状态不允许确认' })
  }

  const beforeData = { status: alert.status, acknowledgerId: alert.acknowledgerId, acknowledgedAt: alert.acknowledgedAt }

  const updated = await prisma.alert.update({
    where: { id },
    data: {
      status: 'ACKNOWLEDGED',
      acknowledgerId: user.id,
      acknowledgedAt: new Date(),
      acknowledgeNote: note || ''
    }
  })

  await createLog({
    actionType: 'ALERT_ACKNOWLEDGE',
    userId: user.id,
    alertId: id,
    beforeData,
    afterData: { status: updated.status, acknowledgerId: updated.acknowledgerId, acknowledgedAt: updated.acknowledgedAt, note: note || '' },
    note: note || '告警已确认'
  })

  if (alert.reporterId && alert.reporterId !== user.id) {
    await createNotification({
      userId: alert.reporterId,
      type: 'alert',
      title: `告警已确认: ${alert.alertNo}`,
      content: `${user.realName} 已确认告警: ${alert.title}`,
      alertId: id
    })
  }

  return updated
})
