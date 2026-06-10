export const generateOrderNo = (prefix = 'BK'): string => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}${year}${month}${day}${random}`
}

export const generateCheckInCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export const formatCurrency = (amount: number): string => {
  return `¥${amount.toFixed(2)}`
}

export const parseTimeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export const calculateDuration = (start: string, end: string): number => {
  return Math.max(0, parseTimeToMinutes(end) - parseTimeToMinutes(start))
}

export const isTimeOverlap = (
  start1: string, end1: string,
  start2: string, end2: string
): boolean => {
  const s1 = parseTimeToMinutes(start1)
  const e1 = parseTimeToMinutes(end1)
  const s2 = parseTimeToMinutes(start2)
  const e2 = parseTimeToMinutes(end2)
  return s1 < e2 && s2 < e1
}

export const getWeekDay = (date: Date): number => {
  const day = date.getDay()
  return day === 0 ? 6 : day - 1
}

export const dateToStr = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

export const isHoliday = (date: Date): boolean => {
  const day = date.getDay()
  return day === 0 || day === 6
}

export const successResponse = (data: any, message = '操作成功') => ({
  code: 0,
  data,
  message
})

export const errorResponse = (message: string, code = 1, data?: any) => ({
  code,
  data: data ?? null,
  message
})

export const paginate = async (
  model: any,
  page: number = 1,
  pageSize: number = 20,
  where: any = {},
  include: any = undefined,
  orderBy: any = { createdAt: 'desc' }
) => {
  const skip = (page - 1) * pageSize
  const [total, list] = await Promise.all([
    model.count({ where }),
    model.findMany({ where, include, skip, take: pageSize, orderBy })
  ])
  return {
    list,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
}
