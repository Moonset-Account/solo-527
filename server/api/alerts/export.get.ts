import { prisma } from '../../plugins/prisma'
import { requireAuth } from '../../utils/auth'
import type { AlertLevel, AlertStatus } from '@prisma/client'

function escapeCSV(value: unknown): string {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)

  const where: Record<string, unknown> = {}

  if (query.status) where.status = query.status as AlertStatus
  if (query.level) where.level = query.level as AlertLevel
  if (query.keyword) {
    where.OR = [
      { title: { contains: query.keyword as string } },
      { alertNo: { contains: query.keyword as string } },
      { serverHost: { contains: query.keyword as string } }
    ]
  }
  if (query.startDate) where.createdAt = { gte: new Date(query.startDate as string) }
  if (query.endDate) where.createdAt = { lte: new Date(query.endDate as string + ' 23:59:59') }

  if (user.role === 'STORE_OPERATOR' && user.storeCode) {
    where.OR = [{ storeCode: user.storeCode }, { storeCode: null }]
  }

  const alerts = await prisma.alert.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      reporter: { select: { realName: true } },
      acknowledger: { select: { realName: true } }
    }
  })

  const headers = ['告警编号', '标题', '级别', '状态', '服务器', 'IP', '指标', '阈值', '当前值', '上报人', '确认人', '确认时间', '解决时间', '异常原因', '门店', '创建时间']
  const rows = alerts.map(a => [
    a.alertNo, a.title, a.level, a.status, a.serverHost, a.serverIp, a.metric, a.threshold, a.currentValue,
    a.reporter?.realName || '', a.acknowledger?.realName || '',
    a.acknowledgedAt ? new Date(a.acknowledgedAt).toLocaleString() : '',
    a.resolvedAt ? new Date(a.resolvedAt).toLocaleString() : '',
    a.abnormalReason || '', a.storeCode || '',
    new Date(a.createdAt).toLocaleString()
  ])

  const csv = '\uFEFF' + [headers, ...rows].map(row => row.map(escapeCSV).join(',')).join('\n')

  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="alerts_${Date.now()}.csv"`)

  return csv
})
