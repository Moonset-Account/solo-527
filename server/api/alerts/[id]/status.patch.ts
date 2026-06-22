import type { AlertStatus } from '@prisma/client'
import { prisma } from '../../../plugins/prisma'
import { requireAuth } from '../../../utils/auth'
import { createLog, diffChanges } from '../../../utils/logger'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = parseInt(getRouterParam(event, 'id') || '0')
  const body = await readBody(event)
  const { status, note, abnormalReason } = body

  const alert = await prisma.alert.findUnique({ where: { id } })
  if (!alert) {
    throw createError({ statusCode: 404, statusMessage: '告警不存在' })
  }

  const validStatuses: AlertStatus[] = ['IN_PROGRESS', 'CHANGING', 'ROLLING_BACK', 'COMPLETED', 'ABNORMAL_ENDED']
  if (!validStatuses.includes(status as AlertStatus)) {
    throw createError({ statusCode: 400, statusMessage: '状态无效' })
  }

  if (status === 'ABNORMAL_ENDED' && !abnormalReason) {
    throw createError({ statusCode: 400, statusMessage: '异常结束必须填写原因' })
  }

  if (alert.status === 'COMPLETED' || alert.status === 'ABNORMAL_ENDED') {
    throw createError({ statusCode: 400, statusMessage: '已结束的告警不能再修改状态' })
  }

  const beforeData = { status: alert.status, abnormalReason: alert.abnormalReason }
  const updateData: Partial<Record<string, unknown>> = { status }

  if (status === 'COMPLETED') {
    updateData.resolvedAt = new Date()
    updateData.resolveNote = note || ''
  }
  if (status === 'ABNORMAL_ENDED') {
    updateData.abnormalReason = abnormalReason
  }

  const updated = await prisma.alert.update({
    where: { id },
    data: updateData
  })

  const afterData = { status: updated.status, abnormalReason: updated.abnormalReason, resolvedAt: updated.resolvedAt }
  const { beforeData: diffBefore, afterData: diffAfter } = diffChanges(
    beforeData as Record<string, unknown>,
    afterData as Record<string, unknown>
  )

  await createLog({
    actionType: status === 'ABNORMAL_ENDED' ? 'ABNORMAL_END' : 'ALERT_STATUS_CHANGE',
    userId: user.id,
    alertId: id,
    beforeData: diffBefore,
    afterData: diffAfter,
    note: note || abnormalReason || `状态变更: ${alert.status} -> ${status}`
  })

  return updated
})
