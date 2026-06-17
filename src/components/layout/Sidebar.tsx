'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import {
  LayoutDashboard,
  FolderKanban,
  Receipt,
  RefreshCw,
  BarChart3,
  AlertTriangle,
  FileText,
  Diamond,
} from 'lucide-react';
import { cn } from '~/lib/utils';

const navItems = [
  { href: '/', label: '工作台', icon: LayoutDashboard },
  { href: '/projects', label: '项目列表', icon: FolderKanban },
  { href: '/quotations', label: '报价/增项', icon: Receipt },
  { href: '/phases', label: '阶段维护', icon: RefreshCw },
  { href: '/budget', label: '预算监控', icon: BarChart3 },
  { href: '/complaints', label: '投诉/风险', icon: AlertTriangle },
  { href: '/reports', label: '月度报表', icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-navy-900 border-r border-navy-700/50 min-h-screen flex flex-col">
      <div className="px-5 py-6 border-b border-navy-700/50">
        <div className="flex items-center gap-2.5">
          <Diamond className="w-5 h-5 text-brand-500 fill-brand-500" />
          <h1 className="text-base font-display font-bold text-white tracking-tight">
            设计项目管理
          </h1>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-all duration-150 border-l-2',
                isActive
                  ? 'bg-navy-700/50 text-brand-500 border-l-brand-500 font-medium'
                  : 'text-navy-300 hover:bg-navy-800 hover:text-white border-l-transparent'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-navy-700/50">
        <div className="flex items-center gap-3">
          <UserButton afterSignOutUrl="/sign-in" />
          <div className="text-xs text-navy-300">账户中心</div>
        </div>
      </div>
    </aside>
  );
}
