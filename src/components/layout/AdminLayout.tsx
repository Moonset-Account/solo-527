import { useState, ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { cn } from '@/lib/utils'

interface AdminLayoutProps {
  title: string
  children: ReactNode
  className?: string
}

export default function AdminLayout({ title, children, className }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        className="hidden lg:flex"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} onToggleSidebar={toggleSidebar} />

        <main className={cn('flex-1 overflow-auto p-6', className)}>
          {children}
        </main>
      </div>

      {sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  )
}
