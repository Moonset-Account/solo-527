'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Vote,
  ClipboardCheck,
  ShieldCheck,
  BarChart3,
  Download,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/utils';
import { useAuthStore } from '@/store/auth';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
}

const adminNavItems: SidebarItem[] = [
  {
    label: '数据概览',
    href: '/admin',
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ['admin'],
  },
  {
    label: '居民台账',
    href: '/admin/residents',
    icon: <Users className="w-5 h-5" />,
    roles: ['admin'],
  },
  {
    label: '议题管理',
    href: '/admin/topics',
    icon: <Vote className="w-5 h-5" />,
    roles: ['admin'],
  },
  {
    label: '整改复查',
    href: '/admin/rectifications',
    icon: <ClipboardCheck className="w-5 h-5" />,
    roles: ['admin'],
  },
  {
    label: '巡逻任务',
    href: '/admin/patrols',
    icon: <ShieldCheck className="w-5 h-5" />,
    roles: ['admin'],
  },
  {
    label: '重复上报统计',
    href: '/admin/reports',
    icon: <BarChart3 className="w-5 h-5" />,
    roles: ['admin'],
  },
  {
    label: '导出任务',
    href: '/admin/exports',
    icon: <Download className="w-5 h-5" />,
    roles: ['admin'],
  },
  {
    label: '系统设置',
    href: '/admin/settings',
    icon: <Settings className="w-5 h-5" />,
    roles: ['admin'],
  },
];

const residentNavItems: SidebarItem[] = [
  {
    label: '首页',
    href: '/resident',
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ['resident'],
  },
  {
    label: '议题列表',
    href: '/resident/topics',
    icon: <Vote className="w-5 h-5" />,
    roles: ['resident'],
  },
  {
    label: '参与历史',
    href: '/resident/history',
    icon: <BarChart3 className="w-5 h-5" />,
    roles: ['resident'],
  },
];

export default function AppLayout({
  children,
  role,
}: {
  children: React.ReactNode;
  role: 'admin' | 'resident';
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const navItems = role === 'admin' ? adminNavItems : residentNavItems;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-primary-700 font-serif">网格事件台</h1>
          <p className="text-xs text-slate-500 mt-1">居民议题台账管理系统</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' + role && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'sidebar-item',
                  isActive && 'sidebar-item-active'
                )}
              >
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-lg mb-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium">
              {user?.name?.slice(0, 1)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500">
                {role === 'admin' ? '管理员' : '居民代表'}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-item w-full text-danger-600 hover:bg-danger-50 hover:text-danger-700"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">退出登录</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64">
        <div className="p-8 max-w-7xl mx-auto min-h-screen">{children}</div>
      </main>
    </div>
  );
}
