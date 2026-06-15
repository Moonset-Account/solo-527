'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAppStore } from '@/store'
import type { AuthUser } from '@/types'

interface SessionContextValue {
  user: AuthUser | null
  loading: boolean
}

const SessionContext = createContext<SessionContextValue>({
  user: null,
  loading: true,
})

interface SessionProviderProps {
  children: ReactNode
  initialUser?: AuthUser | null
}

export function SessionProvider({ children, initialUser = null }: SessionProviderProps) {
  const setUser = useAppStore((s) => s.setUser)
  const [loading, setLoading] = useState(!initialUser)
  const [user, setLocalUser] = useState<AuthUser | null>(initialUser)

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser)
      setLocalUser(initialUser)
      return
    }

    let cancelled = false

    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session', {
          cache: 'no-store',
        })

        if (!cancelled) {
          if (res.ok) {
            const data = (await res.json()) as AuthUser
            setUser(data)
            setLocalUser(data)
          } else {
            setUser(null)
            setLocalUser(null)
          }
        }
      } catch {
        if (!cancelled) {
          setUser(null)
          setLocalUser(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchSession()

    return () => {
      cancelled = true
    }
  }, [initialUser, setUser])

  return (
    <SessionContext.Provider value={{ user, loading }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  return useContext(SessionContext)
}
