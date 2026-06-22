import { prisma } from '../../plugins/prisma'
import { requireAdmin, requireAuth } from '../../utils/auth'
import type { LogActionType } from '@prisma/client'

function escapeCSV(value: unknown): string {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

const actionTypeLabels: Record<string, string> = {
  ALERT_ACKNOWLEDGE: '告警确认',
  ALERT_STATUS_CHANGE: '告警状态变更',
  CHANGE_REQUEST_SUBMIT: '变更申请提交',
  CHANGE_REQUEST_APPROVE: '变更申请批准',
  CHANGE_REQUEST_REJECT: '变更申请驳回',
  CHANGE_WINDOW_OPEN: '变更窗口开启',
  CHANGE_WINDOW_CLOSE: '变更窗口关闭',
  ROLLBACK_EXECUTE: '执行回滚',
  ACCOUNT_APPLY: '账号申请',
  DEVICE_INSPECT: '设备巡检',
  ABNORMAL_END: '异常结束',
  USER_LOGIN: '用户登录',
  USER_LOGOUT: '用户登出'
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)

  const where: Record<string, unknown> = {}
  if (query.actionType) where.actionType = query.actionType as LogActionType
  if (query.alertId) where.alertId = parseInt(query.alertId as string)
  if (query.changeId) where.changeId = parseInt(query.changeId as string)
  if (query.startDate) where.createdAt = { gte: new Date(query.startDate as string) }
  if (query.endDate) where.createdAt = { lte: new Date(query.endDate as string + ' 23:59:59') }

  if (user.role !== 'ADMIN') {
    where.userId = user.id
  } else {
    await requireAdmin(event)
  }

  const logs = await prisma.operationLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { realName: true } },
      alert: { select: { alertNo: true } },
      changeRequest: { select: { changeNo: true } }
    }
  })

  const headers = ['时间', '操作类型', '操作人', '关联告警', '关联变更', '变更前', '变更后', '备注', 'IP']
  const rows = logs.map(l => [
    new Date(l.createdAt).toLocaleString(),
    actionTypeLabels[l.actionType] || l.actionType,
    l.user?.realName || '',
    l.alert?.alertNo || '',
    l.changeRequest?.changeNo || '',
    JSON.stringify(l.beforeData || ''),
    JSON.stringify(l.afterData || ''),
    l.note || '',
    l.ip || ''
  ])

  const csv = '\uFEFF' + [headers, ...rows].map(row => row.map(escapeCSV).join(',')).join('\n')

  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="logs_${Date.now()}.csv"`)

  return csv
})
