'use client'

import { useCallback, useState } from 'react'

export function useApi<T>() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const request = useCallback(async <R = T>(
    url: string,
    options?: RequestInit
  ): Promise<R | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Request failed: ${res.status}`)
      }
      return res.json()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, request, setError }
}
