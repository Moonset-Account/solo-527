import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number, decimals = 2): string {
  return num.toLocaleString('zh-CN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function formatPercent(num: number): string {
  return `${(num * 100).toFixed(1)}%`
}

export function groupBy<T>(arr: T[], key: keyof T | ((item: T) => string)): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = typeof key === 'function' ? key(item) : String(item[key])
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

export function aggregateBy<T>(arr: T[], key: keyof T | ((item: T) => string)): Record<string, number> {
  return arr.reduce((acc, item) => {
    const k = typeof key === 'function' ? key(item) : String(item[key])
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
