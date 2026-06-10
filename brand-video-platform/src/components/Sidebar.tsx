'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Calendar,
  AlertTriangle,
  BarChart3,
  User,
} from 'lucide-react'

const navItems = [
  { href: '/', label: '工作台', icon: LayoutDashboard },
  { href: '/topics', label: '选题管理', icon: FileText },
  { href: '/tasks', label: '任务分派', icon: ClipboardList },
  { href: '/schedule', label: '发布排期', icon: Calendar },
  { href: '/exceptions', label: '异常记录', icon: AlertTriangle },
  { href: '/reports', label: '报表中心', icon: BarChart3 },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-brand-500 flex flex-col z-50">
      <div className="h-16 flex items-center px-6 border-b border-brand-400/30">
        <span className="text-white text-lg font-bold tracking-wide">选题策划台</span>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-brand-400/30 text-white border-l-[3px] border-accent-500'
                  : 'text-brand-200 hover:bg-brand-400/20 hover:text-white'
              }`}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-brand-400/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-300/30 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">张明远</p>
            <p className="text-xs text-brand-200 truncate">品牌内容负责人</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
