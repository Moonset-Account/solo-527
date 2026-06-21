import { DateTime } from 'luxon'

export function formatDate(date: DateTime | Date | string | null | undefined, format = 'yyyy-MM-dd HH:mm:ss'): string {
  if (!date) return ''
  const dt = date instanceof DateTime ? date : DateTime.fromJSDate(date instanceof Date ? date : new Date(date))
  return dt.toFormat(format)
}

export function formatDateShort(date: DateTime | Date | string | null | undefined): string {
  return formatDate(date, 'yyyy-MM-dd')
}

export function calculateCost(promptTokens: number, completionTokens: number, model = 'gpt-4'): number {
  const rate: Record<string, { prompt: number; completion: number }> = {
    'gpt-4': { prompt: 0.00003, completion: 0.00006 },
    'gpt-3.5-turbo': { prompt: 0.0000015, completion: 0.000002 },
    'mock-model': { prompt: 0.00001, completion: 0.00002 },
  }
  const r = rate[model] || rate['mock-model']
  return promptTokens * r.prompt + completionTokens * r.completion
}

export function usdToCents(usd: number): number {
  return Math.round(usd * 100)
}

export function centsToUsd(cents: number): number {
  return cents / 100
}

export interface WeightedItem {
  id: number
  weight: number
}

export function weightedRandomSelect<T extends WeightedItem>(items: T[]): T | null {
  if (items.length === 0) return null
  if (items.length === 1) return items[0]

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  let random = Math.random() * totalWeight

  for (const item of items) {
    random -= item.weight
    if (random <= 0) return item
  }

  return items[items.length - 1]
}

export function grayScaleSelect<T extends WeightedItem>(items: T[]): T | null {
  return weightedRandomSelect(items)
}

export function generateRandomTokens(minPrompt = 500, maxPrompt = 3000, minCompletion = 200, maxCompletion = 1500) {
  const promptTokens = Math.floor(Math.random() * (maxPrompt - minPrompt + 1)) + minPrompt
  const completionTokens = Math.floor(Math.random() * (maxCompletion - minCompletion + 1)) + minCompletion
  return { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens }
}

export function generateRandomId(prefix = ''): string {
  return `${prefix}${Date.now()}${Math.random().toString(36).substring(2, 8)}`
}

export function calculatePercentage(part: number, total: number, decimals = 2): number {
  if (total === 0) return 0
  return Number(((part / total) * 100).toFixed(decimals))
}

export function calculateMoM(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Number((((current - previous) / previous) * 100).toFixed(2))
}

export function getDateRange(days: number): { start: DateTime; end: DateTime } {
  const end = DateTime.now().endOf('day')
  const start = end.minus({ days: days - 1 }).startOf('day')
  return { start, end }
}

export function getPreviousDateRange(days: number): { start: DateTime; end: DateTime } {
  const { end } = getDateRange(days)
  const previousEnd = end.minus({ days: days }).endOf('day')
  const previousStart = previousEnd.minus({ days: days - 1 }).startOf('day')
  return { start: previousStart, end: previousEnd }
}

export function generateDatesArray(start: DateTime, end: DateTime): string[] {
  const dates: string[] = []
  let current = start.startOf('day')
  const last = end.endOf('day')
  while (current <= last) {
    dates.push(current.toFormat('yyyy-MM-dd'))
    current = current.plus({ days: 1 })
  }
  return dates
}

export function paginate(page = 1, perPage = 20) {
  const safePage = Math.max(1, page)
  const safePerPage = Math.min(100, Math.max(1, perPage))
  return {
    page: safePage,
    perPage: safePerPage,
    limit: safePerPage,
    offset: (safePage - 1) * safePerPage,
  }
}

export function buildPaginationMeta(total: number, page: number, perPage: number) {
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  return {
    total,
    page,
    perPage,
    lastPage,
    firstPage: 1,
    hasPrev: page > 1,
    hasNext: page < lastPage,
  }
}

export function successResponse<T = any>(data: T, message = 'ok', pagination?: any) {
  return {
    code: 0,
    message,
    data,
    ...(pagination ? { pagination } : {}),
  }
}

export function errorResponse(code: number, message: string, errors?: any[]) {
  return {
    code,
    message,
    ...(errors && errors.length > 0 ? { errors } : {}),
  }
}

export function round(value: number, decimals = 4): number {
  return Number(value.toFixed(decimals))
}

export function truncate(str: string, maxLength: number, suffix = '...'): string {
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength - suffix.length) + suffix
}
