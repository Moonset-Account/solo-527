import dayjs from 'dayjs'

export function formatDateTime(date?: string | Date): string {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

export function formatDate(date?: string | Date): string {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD')
}

export function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '-'
  
  if (seconds < 60) {
    return `${Math.round(seconds)}秒`
  }
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return `${mins}分${secs}秒`
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}小时${mins}分`
  }
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  return `${days}天${hours}小时`
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '-'
  
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

export function getScoreColor(score: number, maxScore: number = 100): string {
  const percentage = (score / maxScore) * 100
  if (percentage >= 90) return '#52c41a'
  if (percentage >= 80) return '#1890ff'
  if (percentage >= 60) return '#faad14'
  return '#f5222d'
}

export function getStatusColor(status: number, type: 'session' | 'ticket' | 'inspection' | 'knowledge' = 'session'): string {
  if (type === 'session') {
    switch (status) {
      case 0: return '#faad14'
      case 1: return '#1890ff'
      case 2: return '#722ed1'
      case 3: return '#52c41a'
      case 4: return '#8c8c8c'
      default: return '#8c8c8c'
    }
  }
  if (type === 'ticket') {
    switch (status) {
      case 0: return '#faad14'
      case 1: return '#1890ff'
      case 2: return '#722ed1'
      case 3: return '#52c41a'
      case 4: return '#8c8c8c'
      case 5: return '#eb2f96'
      default: return '#8c8c8c'
    }
  }
  if (type === 'inspection') {
    switch (status) {
      case 0: return '#8c8c8c'
      case 1: return '#1890ff'
      case 2: return '#52c41a'
      case 3: return '#faad14'
      case 4: return '#722ed1'
      default: return '#8c8c8c'
    }
  }
  if (type === 'knowledge') {
    switch (status) {
      case 0: return '#8c8c8c'
      case 1: return '#1890ff'
      case 2: return '#52c41a'
      case 3: return '#faad14'
      case 4: return '#bfbfbf'
      case 5: return '#f5222d'
      default: return '#8c8c8c'
    }
  }
  return '#8c8c8c'
}

export function getPriorityColor(priority: number): string {
  switch (priority) {
    case 0: return '#52c41a'
    case 1: return '#1890ff'
    case 2: return '#faad14'
    case 3: return '#f5222d'
    default: return '#8c8c8c'
  }
}

export function downloadFile(data: Blob, filename: string) {
  const url = URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
