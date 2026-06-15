'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import type { AuthUser } from '@/types'
import Sidebar from './Sidebar'
import Header from './Header'

interface AppShellProps {
  children: React.ReactNode
  initialUser?: AuthUser | null
}

export default function AppShell({ children, initialUser }: AppShellProps) {
  const pathname = usePathname()
  const { sidebarOpen, setUser, user: storeUser } = useAppStore()

  useEffect(() => {
    if (initialUser && !storeUser) {
      setUser(initialUser)
    }
  }, [initialUser, storeUser, setUser])

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-200',
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        )}
      >
        <Header />
        <main className="p-4 lg:p-6" key={pathname}>
          {children}
        </main>
      </div>
    </div>
  )
}
