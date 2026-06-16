'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: '首页', icon: '🏠', roles: ['RESIDENT', 'CUSTOMER_SERVICE', 'ENGINEER', 'ADMIN'] },
  { href: '/bills', label: '费用账单', icon: '💰', roles: ['RESIDENT', 'CUSTOMER_SERVICE', 'ADMIN'] },
  { href: '/contracts', label: '合同附件', icon: '📄', roles: ['RESIDENT', 'CUSTOMER_SERVICE', 'ADMIN'] },
  { href: '/visitors', label: '访客预约', icon: '👥', roles: ['RESIDENT', 'CUSTOMER_SERVICE', 'ADMIN'] },
  { href: '/work-orders', label: '工单中心', icon: '🔧', roles: ['RESIDENT', 'CUSTOMER_SERVICE', 'ENGINEER', 'ADMIN'] },
  { href: '/admin/stats', label: '数据报表', icon: '📊', roles: ['CUSTOMER_SERVICE', 'ADMIN'] },
  { href: '/admin/logs', label: '操作日志', icon: '📝', roles: ['ADMIN'] },
]

export default function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted || !session) return null

  const role = session.user.role
  const filteredItems = navItems.filter(item => item.roles.includes(role))

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">🏢 公寓服务门户</h1>
        <p className="text-sm text-gray-500 mt-1">
          {session.user.name || session.user.email}
        </p>
        <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
          {role === 'RESIDENT' && '住户'}
          {role === 'CUSTOMER_SERVICE' && '客服'}
          {role === 'ENGINEER' && '工程师'}
          {role === 'ADMIN' && '管理员'}
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {filteredItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <span>🚪</span>
          <span>退出登录</span>
        </button>
      </div>
    </div>
  )
}
