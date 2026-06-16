'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, BookOpen, BarChart3, AlertTriangle, Settings } from 'lucide-react'
import NotificationCenter from './NotificationCenter'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  status: string
  createdAt: string
}

export default function Navbar({
  unreadCount = 0,
  notifications = [],
}: {
  unreadCount?: number
  notifications?: NotificationItem[]
}) {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    {
      href: '/',
      label: '会话检索',
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      href: '/conversations',
      label: '会话记录',
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      href: '/knowledge',
      label: '知识库',
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      href: '/reports',
      label: '数据报表',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      href: '/risks',
      label: '风险样本',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    {
      href: '/prompts',
      label: '提示词版本',
      icon: <Settings className="w-5 h-5" />,
    },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                {process.env.NEXT_PUBLIC_APP_NAME || '客服知识助手'}
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            <NotificationCenter initialNotifications={notifications} />
          </div>
        </div>
      </div>
    </nav>
  )
}
