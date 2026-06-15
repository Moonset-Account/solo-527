'use client';

import { usePathname } from 'next/navigation';
import {
  CalendarCheck2,
  LayoutDashboard,
  ListTodo,
  PieChart,
  FileBarChart2,
  ScrollText,
  Users2,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface Props {
  role: string;
  name: string;
}

export function AppSidebar({ role, name }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const isAdmin = role === 'ADMIN' || role === 'ADMIN_LEAD';

  const navItems = isAdmin
    ? [
        { href: '/admin', label: '管理首页', icon: LayoutDashboard },
        { href: '/admin/tasks', label: '事项管理', icon: ListTodo },
        { href: '/admin/reminders', label: '催办提醒', icon: FileBarChart2 },
        { href: '/admin/statistics', label: '统计中心', icon: PieChart },
        { href: '/admin/logs', label: '日志审计', icon: ScrollText },
        ...(role === 'ADMIN'
          ? [{ href: '/admin/users', label: '用户管理', icon: Users2 }]
          : []),
      ]
    : [
        { href: '/dashboard', label: '我的待办', icon: ListTodo },
      ];

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-out',
        collapsed ? 'w-[76px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-100">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center shadow-soft">
          <CalendarCheck2 className="w-5 h-5" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-900 truncate">
              周会事项中心
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
              Weekly Meeting
            </div>
          </div>
        )}
      </div>

      {/* 导航 */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {!collapsed && (
          <div className="px-3 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {isAdmin ? '管理后台' : '工作台'}
          </div>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <a
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'sidebar-link group',
                active && 'sidebar-link-active bg-primary/5 text-primary',
                collapsed && 'justify-center px-0'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 shrink-0',
                  active
                    ? 'text-primary'
                    : 'text-slate-400 group-hover:text-primary'
                )}
              />
              {!collapsed && <span>{item.label}</span>}
              {active && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </a>
          );
        })}
      </nav>

      {/* 底部用户区 */}
      <div className="border-t border-slate-100 p-3">
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg p-2.5 bg-slate-50',
            collapsed && 'justify-center'
          )}
        >
          <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent text-white text-xs font-bold flex items-center justify-center">
            {name.slice(0, 1)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-800 truncate">
                {name}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {role === 'ADMIN'
                  ? '系统管理员'
                  : role === 'ADMIN_LEAD'
                    ? '行政负责人'
                    : '普通用户'}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex mt-2 w-full items-center justify-center gap-2 py-2 text-xs text-slate-500 hover:text-primary rounded-lg hover:bg-slate-50 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              收起
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
