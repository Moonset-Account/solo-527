import type { AlertLevel } from '@prisma/client'
import { prisma } from '../../plugins/prisma'
import { requireAuth } from '../../utils/auth'
import { generateAlertNo } from '../../utils/generator'
import { createLog } from '../../utils/logger'
import { notifyAdmins } from '../../utils/notification'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)

  const { title, level, serverHost, serverIp, metric, threshold, currentValue, description, storeCode } = body

  if (!title || !level || !serverHost || !serverIp || !metric || !threshold || !currentValue) {
    throw createError({ statusCode: 400, statusMessage: '缺少必要参数' })
  }

  const validLevels: AlertLevel[] = ['INFO', 'WARNING', 'ERROR', 'CRITICAL']
  if (!validLevels.includes(level as AlertLevel)) {
    throw createError({ statusCode: 400, statusMessage: '告警级别无效' })
  }

  const alert = await prisma.alert.create({
    data: {
      alertNo: generateAlertNo(),
      title,
      level: level as AlertLevel,
      serverHost,
      serverIp,
      metric,
      threshold,
      currentValue,
      description,
      reporterId: user.id,
      storeCode: storeCode || user.storeCode
    }
  })

  await createLog({
    actionType: 'ALERT_STATUS_CHANGE',
    userId: user.id,
    alertId: alert.id,
    afterData: { status: 'PENDING', title, level, serverHost, serverIp },
    note: '告警创建'
  })

  await notifyAdmins({
    type: 'alert',
    title: `新告警: ${alert.alertNo}`,
    content: `${user.realName} 上报了新告警: ${title} (${level})`,
    alertId: alert.id
  })

  return alert
})
