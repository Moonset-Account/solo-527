'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Clock,
  FileText,
  Receipt,
  CreditCard,
  BarChart3,
  DoorOpen,
  LogOut,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isClient = role === 'CLIENT';

  const adminNav = [
    { href: '/', label: '仪表板', icon: LayoutDashboard },
    { href: '/clients', label: '客户管理', icon: Users },
    { href: '/projects', label: '项目看板', icon: FolderKanban },
    { href: '/timesheets', label: '工时记录', icon: Clock },
    { href: '/quotes', label: '报价单', icon: FileText },
    { href: '/invoices', label: '发票管理', icon: Receipt },
    { href: '/payments', label: '收款记录', icon: CreditCard },
    { href: '/reports', label: '统计报表', icon: BarChart3 },
  ];

  const clientNav = [
    { href: '/portal', label: '我的项目', icon: FolderKanban },
    { href: '/portal/invoices', label: '我的发票', icon: Receipt },
  ];

  const navItems = isClient ? clientNav : adminNav;

  return (
    <div className="hidden md:flex w-64 flex-col bg-white border-r border-gray-200 h-screen fixed left-0 top-0">
      <div className="p-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">FlowWork</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100">
        {session?.user && (
          <div className="flex items-center gap-3 px-3 py-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {session.user.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {session.user.name}
              </div>
              <div className="text-xs text-gray-500">
                {role === 'ADMIN' ? '管理员' : role === 'DESIGNER' ? '设计师' : '客户'}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
        >
          <LogOut className="w-5 h-5" />
          退出登录
        </button>
      </div>
    </div>
  );
}
