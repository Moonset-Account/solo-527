'use client'

import { useState, useRef, useEffect } from 'react'
import { Menu, Bell, LogOut, User, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import { ROLE_LABELS } from '@/types'

const PATH_TITLES: Record<string, string> = {
  '/booking': '预约大厅',
  '/booking/mine': '我的预约',
  '/archive': '数据归档',
  '/api-status': '接口状态',
  '/permissions': '权限控制',
  '/equipment': '设备看板',
  '/equipment/alerts': '停用提醒',
  '/admin/samples': '管理面板',
  '/admin/reports': '课题报表',
}

function getPageTitle(pathname: string): string {
  if (PATH_TITLES[pathname]) return PATH_TITLES[pathname]
  const matchedKey = Object.keys(PATH_TITLES)
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname.startsWith(key))
  return matchedKey ? PATH_TITLES[matchedKey] : '实验预约站'
}

export default function Header() {
  const { user, toggleSidebar } = useAppStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const pageTitle = typeof window !== 'undefined'
    ? getPageTitle(window.location.pathname)
    : '实验预约站'

  const initials = user?.display_name
    ? user.display_name.slice(0, 2)
    : '用户'

  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors lg:hidden"
        >
          <Menu className="h-5 w-5 text-slate-600" />
        </button>
        <h1 className="text-lg font-semibold text-slate-800">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <Bell className="h-5 w-5 text-slate-500" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500" />
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-teal-700 text-white flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            <span className="hidden sm:block text-sm font-medium text-slate-700">
              {user?.display_name || '用户'}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 animate-slide-in">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900">{user?.display_name || '用户'}</p>
                <p className="text-xs text-slate-500">{user?.email || ''}</p>
                {user?.role && (
                  <span className="badge-info mt-1 inline-block">
                    {ROLE_LABELS[user.role]}
                  </span>
                )}
              </div>
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                <User className="h-4 w-4" />
                个人资料
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <LogOut className="h-4 w-4" />
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
