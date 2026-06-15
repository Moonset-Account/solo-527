'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Calendar,
  ClipboardList,
  Archive,
  Activity,
  Shield,
  BarChart3,
  AlertTriangle,
  Settings,
  FileText,
  FlaskConical,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import { canAccess } from '@/hooks/useRoleAccess'
import type { UserRole } from '@/types'

interface NavItem {
  label: string
  icon: React.ElementType
  href: string
  allowedRoles?: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  { label: '预约大厅', icon: Calendar, href: '/booking' },
  { label: '我的预约', icon: ClipboardList, href: '/booking/mine' },
  { label: '数据归档', icon: Archive, href: '/archive', allowedRoles: ['archivist', 'admin'] },
  { label: '接口状态', icon: Activity, href: '/api-status', allowedRoles: ['admin'] },
  { label: '权限控制', icon: Shield, href: '/permissions', allowedRoles: ['admin'] },
  { label: '设备看板', icon: BarChart3, href: '/equipment', allowedRoles: ['equipment_teacher', 'admin'] },
  { label: '停用提醒', icon: AlertTriangle, href: '/equipment/alerts', allowedRoles: ['equipment_teacher', 'admin'] },
  { label: '管理面板', icon: Settings, href: '/admin/samples', allowedRoles: ['admin'] },
  { label: '课题报表', icon: FileText, href: '/admin/reports', allowedRoles: ['admin'] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, sidebarOpen, toggleSidebar } = useAppStore()
  const role = user?.role

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.allowedRoles || !role || item.allowedRoles.includes(role)
  )

  const isActive = (href: string) => {
    if (href === '/booking') return pathname === '/booking' || pathname === '/booking/mine' ? pathname === '/booking' : pathname.startsWith(href + '/')
    return pathname.startsWith(href)
  }

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-white transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-700/50">
          <Link href="/" className="flex items-center gap-2.5">
            <FlaskConical className="h-7 w-7 text-teal-400" />
            <span className="text-lg font-bold tracking-tight">实验预约站</span>
          </Link>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1 rounded hover:bg-slate-700/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-4 px-3 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {visibleItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) toggleSidebar()
                }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                  active
                    ? 'bg-teal-700/30 text-teal-300'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <item.icon className={cn('h-5 w-5 shrink-0', active ? 'text-teal-400' : 'text-slate-400')} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
