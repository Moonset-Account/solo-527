import { format, parseISO, isThisWeek, isThisMonth } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { TopicStatus, TOPIC_STATUS_MAP, TimelineEventType } from './types'

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'yyyy-MM-dd', { locale: zhCN })
}

export function formatDateTime(dateStr: string): string {
  return format(parseISO(dateStr), 'yyyy-MM-dd HH:mm', { locale: zhCN })
}

export function isThisWeekDate(dateStr: string): boolean {
  return isThisWeek(parseISO(dateStr))
}

export function isThisMonthDate(dateStr: string): boolean {
  return isThisMonth(parseISO(dateStr))
}

export function getStatusLabel(status: TopicStatus): string {
  return TOPIC_STATUS_MAP[status]?.label || status
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export const TIMELINE_ICON_MAP: Record<TimelineEventType, { icon: string; color: string }> = {
  topic_created: { icon: 'PlusCircle', color: 'text-blue-500' },
  topic_approved: { icon: 'CheckCircle', color: 'text-emerald-500' },
  topic_rejected: { icon: 'XCircle', color: 'text-red-500' },
  script_submitted: { icon: 'FileText', color: 'text-indigo-500' },
  script_approved: { icon: 'FileCheck', color: 'text-emerald-500' },
  task_assigned: { icon: 'UserPlus', color: 'text-purple-500' },
  task_completed: { icon: 'CheckCircle2', color: 'text-green-500' },
  exception_created: { icon: 'AlertTriangle', color: 'text-amber-500' },
  exception_resolved: { icon: 'ShieldCheck', color: 'text-emerald-500' },
  schedule_created: { icon: 'CalendarPlus', color: 'text-cyan-500' },
  published: { icon: 'Send', color: 'text-green-500' },
}

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => {
        const val = row[h]
        const str = val === null || val === undefined ? '' : String(val)
        return `"${str.replace(/"/g, '""')}"`
      }).join(',')
    ),
  ].join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

export function exportToExcel(data: Record<string, unknown>[], filename: string) {
  import('xlsx').then((XLSX) => {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    XLSX.writeFile(wb, `${filename}.xlsx`)
  })
}
