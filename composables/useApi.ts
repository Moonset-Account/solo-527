import type { FetchOptions } from 'ofetch'

export async function request<T = any>(path: string, options: FetchOptions = {}): Promise<T> {
  const traceId = localStorage?.getItem('traceId')
  const headers: any = options.headers || {}
  if (traceId) headers['x-trace-id'] = traceId
  const data = await $fetch<any>(`/api${path}`, {
    ...options,
    headers
  })
  if (data && typeof data === 'object' && 'code' in data) {
    if (data.code !== 0) {
      const msg = data.message || '请求失败'
      alert(msg)
      throw new Error(msg)
    }
    return data.data
  }
  return data as T
}

export function useOperator(): { name: string; setName: (n: string) => void } {
  const key = 'resident_board_operator'
  if (import.meta.server) return { name: 'system', setName: () => {} }
  const name = useState<string>(key, () => localStorage.getItem(key) || '')
  return {
    name: name.value || 'system',
    setName(n: string) {
      localStorage.setItem(key, n)
      name.value = n
    }
  }
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING: '待处理',
  VOTING: '投票中',
  RECTIFYING: '整改中',
  REVIEWING: '复查中',
  DONE: '已完成',
  CANCELLED: '已取消'
}

export const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-200 text-gray-800',
  VOTING: 'bg-blue-100 text-blue-700',
  RECTIFYING: 'bg-yellow-100 text-yellow-800',
  REVIEWING: 'bg-purple-100 text-purple-700',
  DONE: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700'
}

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: '低',
  NORMAL: '普通',
  HIGH: '高',
  URGENT: '紧急'
}

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-gray-500',
  NORMAL: 'text-blue-600',
  HIGH: 'text-orange-600',
  URGENT: 'text-red-600'
}

export function fmtDateTime(s?: string | Date | null) {
  if (!s) return '-'
  const d = typeof s === 'string' ? new Date(s) : s
  return d.toLocaleString('zh-CN')
}
