'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FileText,
  Video,
  FolderOpen,
  CheckSquare,
  AlertTriangle,
  BarChart3,
  Download,
  LogOut,
  User,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { UserRole } from '@prisma/client'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  roles?: UserRole[]
}

const navItems: NavItem[] = [
  { href: '/', label: '选题脚本', icon: <FileText size={20} /> },
  { href: '/materials', label: '素材库', icon: <FolderOpen size={20} /> },
  { href: '/todos', label: '待办事项', icon: <CheckSquare size={20} /> },
  {
    href: '/anomalies',
    label: '异常池',
    icon: <AlertTriangle size={20} />,
    roles: [UserRole.ADMIN, UserRole.EDITOR_SUPERVISOR, UserRole.EDITOR],
  },
  { href: '/production', label: '产能记录', icon: <BarChart3 size={20} /> },
  { href: '/exports', label: '导出任务', icon: <Download size={20} /> },
]

const Sidebar: React.FC = () => {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const isActive = (href: string) => pathname === href

  const hasAccess = (item: NavItem) => {
    if (!item.roles) return true
    if (!user) return false
    return item.roles.includes(user.role)
  }

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-screen">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Video size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg">品牌素材库</h1>
            <p className="text-xs text-gray-400">短视频协作平台</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.filter(hasAccess).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive(item.href)
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        {user && (
          <div className="mb-4 p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <User size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">
                  {user.role === 'ADMIN'
                    ? '管理员'
                    : user.role === 'EDITOR_SUPERVISOR'
                    ? '编辑主管'
                    : user.role === 'EDITOR'
                    ? '编辑'
                    : user.role === 'CREATOR'
                    ? '创作者'
                    : '查看者'}
                </p>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar
