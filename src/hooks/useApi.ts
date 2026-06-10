import { useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'

interface ApiState<T> {
  data: T | null
  error: string | null
  loading: boolean
}

interface UseApiReturn<T> extends ApiState<T> {
  execute: (url: string, options?: RequestInit) => Promise<T | null>
}

export function useApi<T = unknown>(): UseApiReturn<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    error: null,
    loading: false,
  })
  const token = useAuthStore((s) => s.token)
  const logout = useAuthStore((s) => s.logout)

  const execute = useCallback(
    async (url: string, options: RequestInit = {}): Promise<T | null> => {
      setState({ data: null, error: null, loading: true })
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(options.headers as Record<string, string> | undefined),
        }
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
        const res = await fetch(url, { ...options, headers })
        if (res.status === 401) {
          logout()
          setState({ data: null, error: '认证已过期，请重新登录', loading: false })
          return null
        }
        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: '请求失败' }))
          throw new Error(err.message || `请求失败 (${res.status})`)
        }
        const data = await res.json()
        setState({ data, error: null, loading: false })
        return data
      } catch (error) {
        const message = error instanceof Error ? error.message : '请求失败'
        setState({ data: null, error: message, loading: false })
        return null
      }
    },
    [token, logout]
  )

  return { ...state, execute }
}
