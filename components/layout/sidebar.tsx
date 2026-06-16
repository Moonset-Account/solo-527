'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileCheck,
  ShieldAlert,
  FileText,
  Bell,
  Users,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  userRole?: string;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const getNavItems = () => {
    const baseItems = [
      {
        title: '仪表板',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        title: '检查清单',
        href: '/checklists',
        icon: FileCheck,
      },
      {
        title: '风险看板',
        href: '/risks',
        icon: ShieldAlert,
      },
    ];

    if (userRole === 'LEGAL' || userRole === 'ADMIN') {
      baseItems.push({
        title: '合同管理',
        href: '/contracts',
        icon: FileText,
      });
    }

    if (userRole === 'PRO_BONO_LAWYER' || userRole === 'ADMIN') {
      baseItems.push({
        title: '越权提醒',
        href: '/alerts',
        icon: Bell,
      });
    }

    if (userRole === 'ADMIN') {
      baseItems.push({
        title: '用户管理',
        href: '/users',
        icon: Users,
      });
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-slate-50">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">合规清单台</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? 'bg-blue-100 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.title}
          </Link>
        ))}
      </nav>
      <div className="border-t p-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <Settings className="h-5 w-5" />
          设置
        </Link>
      </div>
    </div>
  );
}
