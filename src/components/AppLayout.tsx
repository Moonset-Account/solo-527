'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import {
  LayoutDashboard,
  Package,
  FileText,
  HandshakeIcon,
  AlertTriangle,
  ClipboardList,
  Wallet,
  Bell,
  Users,
  Settings,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { userRoleConfig } from '@/lib/config'

const navItems = [
  { name: '工作台', href: '/dashboard', icon: LayoutDashboard, roles: ['EMPLOYEE', 'PROCUREMENT_MANAGER', 'SUPPLIER_COORDINATOR', 'APPROVER', 'ADMIN'] },
  { name: '耗材登记', href: '/supply', icon: Package, roles: ['EMPLOYEE', 'PROCUREMENT_MANAGER', 'ADMIN'] },
  { name: '月度用量', href: '/supply/monthly', icon: ClipboardList, roles: ['EMPLOYEE', 'PROCUREMENT_MANAGER', 'ADMIN'] },
  { name: '采购需求', href: '/procurement/requirements', icon: FileText, roles: ['EMPLOYEE', 'PROCUREMENT_MANAGER', 'ADMIN'] },
  { name: '框架协议', href: '/procurement/agreements', icon: HandshakeIcon, roles: ['PROCUREMENT_MANAGER', 'ADMIN'] },
  { name: '供应商报价', href: '/procurement/quotes', icon: FileText, roles: ['PROCUREMENT_MANAGER', 'ADMIN'] },
  { name: '交付管理', href: '/procurement/deliveries', icon: Package, roles: ['PROCUREMENT_MANAGER', 'SUPPLIER_COORDINATOR', 'ADMIN'] },
  { name: '对账处理', href: '/reconciliation', icon: ClipboardList, roles: ['PROCUREMENT_MANAGER', 'ADMIN'] },
  { name: '付款建议', href: '/reconciliation/payments', icon: Wallet, roles: ['PROCUREMENT_MANAGER', 'APPROVER', 'ADMIN'] },
  { name: '付款差异', href: '/reconciliation/payment-discrepancies', icon: AlertTriangle, roles: ['SUPPLIER_COORDINATOR', 'APPROVER', 'ADMIN'] },
  { name: '供应商风险', href: '/risk', icon: AlertTriangle, roles: ['PROCUREMENT_MANAGER', 'SUPPLIER_COORDINATOR', 'APPROVER', 'ADMIN'] },
  { name: '风险看板', href: '/risk/board', icon: AlertTriangle, roles: ['PROCUREMENT_MANAGER', 'APPROVER', 'ADMIN'] },
  { name: '提醒规则', href: '/risk/alerts', icon: Bell, roles: ['ADMIN'] },
  { name: '用户管理', href: '/admin/users', icon: Users, roles: ['ADMIN'] },
  { name: '供应商管理', href: '/admin/suppliers', icon: HandshakeIcon, roles: ['PROCUREMENT_MANAGER', 'ADMIN'] },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useUser()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const userRole = (user?.publicMetadata?.role as string) || 'EMPLOYEE'
  const visibleItems = navItems.filter(item => item.roles.includes(userRole))

  return (
    <div className="min-h-screen flex">
      <div
        className={`fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-primary">
            <HandshakeIcon className="w-6 h-6" />
            <span>耗材对账系统</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="flex-1 truncate">{item.name}</span>
                {isActive && <ChevronRight className="w-4 h-4 shrink-0" />}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
              {(user?.publicMetadata?.role && (
                <span className={`badge ${(userRoleConfig as any)[userRole as keyof typeof userRoleConfig]?.className || ''}`}>
                  {(userRoleConfig as any)[userRole as keyof typeof userRoleConfig]?.label || userRole}
                </span>
              )) as React.ReactNode}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <UserButton
              showName={true}
              appearance={{
                elements: {
                  userButtonBox: 'flex-row-reverse',
                  userButtonOuterIdentifier: 'text-sm font-medium',
                },
              }}
            />
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
