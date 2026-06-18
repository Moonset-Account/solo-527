import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export { dayjs }

export function formatDate(date: any, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export function formatDateShort(date: any) {
  return formatDate(date, 'YYYY-MM-DD')
}

export function fromNow(date: any) {
  if (!date) return '-'
  return dayjs(date).fromNow()
}

export function formatNumber(num: number | string, decimals = 0) {
  if (num === null || num === undefined || num === '') return '-'
  const n = Number(num)
  if (isNaN(n)) return '-'
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

export function formatPercent(num: number | string, decimals = 1) {
  if (num === null || num === undefined || num === '') return '-'
  const n = Number(num)
  if (isNaN(n)) return '-'
  return `${n >= 0 ? '+' : ''}${n.toFixed(decimals)}%`
}

export function formatFileSize(bytes: number) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(2)} ${units[i]}`
}

export const severityMap: Record<string, { label: string; type: string; class: string; color: string }> = {
  critical: { label: '严重', type: 'danger', class: 'tag-critical', color: '#ff4d4f' },
  warning: { label: '警告', type: 'warning', class: 'tag-warning', color: '#fa8c16' },
  info: { label: '提示', type: 'info', class: 'tag-info', color: '#1890ff' }
}

export const statusMap: Record<string, { label: string; type: string; color: string }> = {
  pending: { label: '待处理', type: 'warning', color: '#e6a23c' },
  processing: { label: '处理中', type: 'primary', color: '#409eff' },
  resolved: { label: '已解决', type: 'success', color: '#67c23a' },
  ignored: { label: '已忽略', type: 'info', color: '#909399' }
}

export const categoryMap: Record<string, { label: string; icon: string }> = {
  user_growth: { label: '用户增长', icon: 'User' },
  retention: { label: '留存分析', icon: 'Refresh' },
  conversion: { label: '转化漏斗', icon: 'TrendCharts' },
  activation: { label: '用户激活', icon: 'Lightning' },
  revenue: { label: '营收数据', icon: 'Money' },
  other: { label: '其他', icon: 'MoreFilled' }
}

export const notificationTypeMap: Record<string, { label: string; icon: string; color: string }> = {
  anomaly_detected: { label: '异常检测', icon: 'Warning', color: '#f56c6c' },
  alert_triggered: { label: '告警触发', icon: 'Bell', color: '#e6a23c' },
  permission_expiring: { label: '权限即将过期', icon: 'Clock', color: '#409eff' },
  permission_expired: { label: '权限已过期', icon: 'CircleClose', color: '#f56c6c' },
  anomaly_assigned: { label: '任务分配', icon: 'UserFilled', color: '#67c23a' },
  report_reminder: { label: '报表提醒', icon: 'Document', color: '#909399' },
  mention: { label: '@我的', icon: 'ChatDotRound', color: '#409eff' },
  system: { label: '系统通知', icon: 'InfoFilled', color: '#909399' }
}

export const priorityMap: Record<string, { label: string; color: string }> = {
  critical: { label: '紧急', color: '#ff4d4f' },
  high: { label: '高', color: '#fa8c16' },
  normal: { label: '普通', color: '#1890ff' },
  low: { label: '低', color: '#52c41a' }
}

export const roleMap: Record<string, { label: string; color: string }> = {
  admin: { label: '超级管理员', color: '#ff4d4f' },
  manager: { label: '运营经理', color: '#722ed1' },
  operator: { label: '运营专员', color: '#1890ff' },
  viewer: { label: '查看员', color: '#8c8c8c' }
}

export const reportStatusMap: Record<string, { label: string; type: string }> = {
  draft: { label: '草稿', type: 'info' },
  published: { label: '已发布', type: 'success' },
  archived: { label: '已归档', type: '' }
}

export const reportTypeMap: Record<string, string> = {
  weekly: '周报',
  monthly: '月报',
  custom: '自定义'
}

export function getSeverityInfo(severity: string) {
  return severityMap[severity] || severityMap.info
}

export function getStatusInfo(status: string) {
  return statusMap[status] || { label: status, type: 'info' }
}

export function getCategoryInfo(category: string) {
  return categoryMap[category] || categoryMap.other
}

export function downloadFile(url: string, filename?: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename || ''
  link.click()
}

export function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
}
