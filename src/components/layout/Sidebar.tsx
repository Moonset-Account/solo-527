'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Kanban,
  List,
  Users2,
  TrendingUp,
  BarChart3,
  Settings2,
  Tags,
  FileCheck2,
  UserCog,
  Shield,
  Building2,
} from 'lucide-react';
import { cn, roleLabel } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { LogOut } from 'lucide-react';

const menuItems = [
  {
    group: '工作台',
    items: [
      { href: '/', label: '仪表盘', icon: LayoutDashboard },
    ],
  },
  {
    group: '线索管理',
    items: [
      { href: '/pipeline', label: '线索管道', icon: Kanban },
      { href: '/pipeline/list', label: '线索列表', icon: List },
      { href: '/pool', label: '公海池', icon: Building2 },
    ],
  },
  {
    group: '数据分析',
    items: [
      { href: '/analytics/prediction', label: '成交预测', icon: TrendingUp },
      { href: '/analytics/revisit', label: '回访报表', icon: BarChart3 },
    ],
  },
  {
    group: '系统设置',
    items: [
      { href: '/settings/stages', label: '跟进阶段', icon: Settings2 },
      { href: '/settings/tags', label: '客户标签', icon: Tags },
      { href: '/settings/rules', label: '校验规则', icon: FileCheck2 },
    ],
  },
  {
    group: '用户管理',
    items: [
      { href: '/admin/users', label: '用户账号', icon: UserCog },
      { href: '/admin/roles', label: '角色权限', icon: Shield },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, logout } = useAppStore();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-60 h-screen bg-white border-r border-gray-200 shadow-sidebar flex flex-col shrink-0">
      <div className="h-16 flex items-center px-5 border-b border-gray-100 shrink-0">
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white font-bold">
          装
        </div>
        <div className="ml-3">
          <div className="font-semibold text-gray-900 text-sm">装修线索管道</div>
          <div className="text-xs text-gray-400">Decoration CRM</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-3">
        {menuItems.map((group) => (
          <div key={group.group} className="mb-4">
            <div className="px-3 mb-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              {group.group}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group',
                      active
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-[18px] w-[18px] shrink-0 transition-colors',
                        active ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-600'
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-100 shrink-0">
        {currentUser && (
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="w-9 h-9 rounded-full gradient-card-purple flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {currentUser.name.slice(0, 1)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</div>
              <div className="text-xs text-gray-400 truncate">{roleLabel(currentUser.role)}</div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="退出登录"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
