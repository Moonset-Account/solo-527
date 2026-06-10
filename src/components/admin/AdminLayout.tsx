'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  Users,
  Settings,
  Package,
  Clock,
  Bell,
  RefreshCw,
  History,
  BarChart3,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: '仪表盘', icon: LayoutDashboard },
  { href: '/admin/plans', label: '套餐配置', icon: Package },
  { href: '/admin/billing-rules', label: '账期规则', icon: Clock },
  { href: '/admin/seats', label: '席位管理', icon: Users },
  { href: '/admin/trials', label: '试用管理', icon: RefreshCw },
  { href: '/admin/thresholds', label: '用量阈值', icon: Bell },
  { href: '/admin/refunds', label: '退款管理', icon: Shield },
  { href: '/admin/refunds/stats', label: '退款统计', icon: BarChart3 },
  { href: '/admin/changes', label: '变更记录', icon: History },
  { href: '/admin/settings', label: '系统设置', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-slate-900 text-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-white">计费中台</h1>
            <p className="text-xs text-slate-400">管理后台</p>
          </div>
        </Link>
      </div>
      
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg mx-2 transition-all duration-200',
                  isActive
                    ? 'bg-primary-600/20 text-primary-300 border-l-2 border-primary-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-sm font-bold">
            管
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">系统管理员</p>
            <p className="text-xs text-slate-400 truncate">admin@example.com</p>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 mx-2 mt-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回用户端
        </Link>
      </div>
    </aside>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />
      <main className="ml-60 min-h-screen">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
