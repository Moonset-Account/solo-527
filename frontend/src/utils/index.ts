import dayjs from 'dayjs'

export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD HH:mm:ss'): string => {
  return dayjs(date).format(format)
}

export const formatNumber = (num: number): string => {
  return num.toLocaleString()
}
