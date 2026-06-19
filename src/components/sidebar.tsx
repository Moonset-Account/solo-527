'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  Bell,
  Settings,
  Shield,
  Clock,
  LayoutDashboard,
  Users,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/app/context/user-context';

const navItems = [
  { href: '/', label: '日常入口', icon: LayoutDashboard },
  { href: '/contracts', label: '合同管理', icon: FileText },
  { href: '/reminders', label: '待办提醒', icon: Bell },
  { href: '/material-board', label: '材料完整看板', icon: FileCheck },
  { href: '/reminder-rules', label: '提醒规则', icon: Settings },
  { href: '/permissions', label: '权限设置', icon: Shield },
  { href: '/operation-logs', label: '操作留痕', icon: Clock },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useCurrentUser();

  return (
    <div className="flex h-screen w-64 flex-col bg-slate-900 text-white">
      <div className="flex h-16 items-center border-b border-slate-700 px-6">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary-400" />
          <span className="text-lg font-bold">合同审查系统</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-700 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-medium">
          {user.name.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-medium">{user.name}</div>
            <div className="text-xs text-slate-400">{user.roleLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
