import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.locale('zh-cn')
dayjs.extend(relativeTime)

export const formatDate = (date: any, format: string = 'YYYY-MM-DD') => {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export const formatDateTime = (date: any, format: string = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export const formatMoney = (amount: any, decimals: number = 2) => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return '0.00'
  return Number(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

export const fromNow = (date: any) => {
  if (!date) return '-'
  return dayjs(date).fromNow()
}

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(new Blob([blob]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export const getRoleLabel = (role: string) => {
  const map: Record<string, string> = {
    admin: '管理员',
    operator: '运营专员',
    finance: '财务人员',
    video_team: '视频团队'
  }
  return map[role] || role
}
