import { format, formatDistanceToNow, differenceInMinutes } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import redis from './redis'

export function formatDate(date: Date | string, pattern: string = 'yyyy-MM-dd HH:mm:ss') {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, pattern, { locale: zhCN })
}

export function formatRelative(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { locale: zhCN, addSuffix: true })
}

export function calculateDuration(start: Date | string, end?: Date | string): number {
  const s = typeof start === 'string' ? new Date(start) : start
  const e = end ? (typeof end === 'string' ? new Date(end) : end) : new Date()
  return differenceInMinutes(e, s)
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
  }).format(num)
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: any, ttl: number = 300): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(value))
  } catch {
    console.error('Cache set failed')
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch {
    console.error('Cache delete failed')
  }
}

export function withErrorHandler(fn: Function) {
  return async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error: any) {
      console.error('Error:', error)
      return {
        success: false,
        error: error.message || 'Internal server error',
      }
    }
  }
}
