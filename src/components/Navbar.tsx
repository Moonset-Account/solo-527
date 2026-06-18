'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignInButton, UserButton, useAuth, useUser } from '@clerk/nextjs'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const baseNavItems = [
  { href: '/', label: '首页', icon: '🏠' },
  { href: '/topics', label: '议题投票', icon: '🗳️' },
  { href: '/facilities', label: '设施管理', icon: '🏢' },
  { href: '/volunteer', label: '志愿服务', icon: '🤝' },
]

export function Navbar() {
  const pathname = usePathname()
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏘️</span>
            <span className="text-lg font-bold text-slate-900 sm:text-xl">
              居民议题协商投票站
            </span>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {baseNavItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
            <Link
              href="/admin/audit"
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname?.startsWith('/admin/audit')
                  ? 'bg-rose-50 text-rose-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <span>📜</span>
              <span>审计日志</span>
            </Link>
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname?.startsWith('/admin') && !pathname?.startsWith('/admin/audit')
                  ? 'bg-rose-50 text-rose-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <span>⚙️</span>
              <span>后台管理</span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
                  登录
                </button>
              </SignInButton>
            ) : (
              <UserButton />
            )}
            <button
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="菜单"
            >
              <span className="text-xl">{mobileOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="flex flex-col gap-1 pb-4 md:hidden">
            {baseNavItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
            <Link
              href="/admin/audit"
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                pathname?.startsWith('/admin/audit')
                  ? 'bg-rose-50 text-rose-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <span>📜</span>
              <span>审计日志</span>
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                pathname?.startsWith('/admin') && !pathname?.startsWith('/admin/audit')
                  ? 'bg-rose-50 text-rose-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <span>⚙️</span>
              <span>后台管理</span>
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
