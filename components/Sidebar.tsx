'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Car,
  Package,
  Wrench,
  ClipboardCheck,
  CalendarClock,
  GitBranch,
  AlertTriangle,
  Settings,
  Users,
  Shield,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { roleCanAccess, cn, roleLabel } from '@/lib/utils';
import type { UserRole } from '@/lib/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[] | 'all';
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: '业务总览',
    items: [
      {
        href: '/dashboard',
        label: '工作台',
        icon: LayoutDashboard,
        roles: 'all',
      },
    ],
  },
  {
    label: '车辆与工单',
    items: [
      {
        href: '/vehicles',
        label: '车辆管理',
        icon: Car,
        roles: ['reception', 'store_manager'],
      },
      {
        href: '/workorders',
        label: '维修工单',
        icon: Wrench,
        roles: 'all',
      },
    ],
  },
  {
    label: '配件仓储',
    items: [
      {
        href: '/parts',
        label: '配件管理',
        icon: Package,
        roles: ['warehouse', 'store_manager'],
      },
      {
        href: '/parts/turnover',
        label: '配件周转明细',
        icon: GitBranch,
        roles: ['warehouse', 'store_manager'],
      },
    ],
  },
  {
    label: '生产与质检',
    items: [
      {
        href: '/production/schedule',
        label: '班组排期',
        icon: CalendarClock,
        roles: ['team_lead', 'store_manager'],
      },
      {
        href: '/production/nodes',
        label: '生产节点查询',
        icon: GitBranch,
        roles: ['team_lead', 'store_manager'],
      },
      {
        href: '/quality',
        label: '质检中心',
        icon: ClipboardCheck,
        roles: ['inspector', 'store_manager'],
      },
    ],
  },
  {
    label: '变更与监控',
    items: [
      {
        href: '/order-changes',
        label: '订单变更',
        icon: AlertTriangle,
        roles: ['reception', 'store_manager'],
      },
      {
        href: '/callbacks',
        label: '回调监控',
        icon: AlertTriangle,
        roles: ['store_manager'],
      },
    ],
  },
  {
    label: '系统管理',
    items: [
      {
        href: '/settings/users',
        label: '用户管理',
        icon: Users,
        roles: ['store_manager'],
      },
      {
        href: '/settings/roles',
        label: '角色权限',
        icon: Shield,
        roles: ['store_manager'],
      },
    ],
  },
];

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const currentUser = useAppStore((s) => s.currentUser);
  const role = currentUser?.role ?? 'reception';

  return (
    <aside
      className={cn(
        'h-full bg-gradient-to-b from-brand-700 to-brand-800 text-white flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="h-16 flex items-center gap-2 px-4 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
          汽
        </div>
        {!collapsed && (
          <div className="truncate">
            <div className="text-sm font-semibold">汽配协同台</div>
            <div className="text-[11px] text-white/60">Auto Parts Collab</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2 space-y-6">
        {NAV_GROUPS.map((group) => {
          const visible = group.items.filter((i) => roleCanAccess(role, i.roles));
          if (!visible.length) return null;
          return (
            <div key={group.label}>
              {!collapsed && (
                <div className="px-3 mb-2 text-[11px] uppercase tracking-wider text-white/40">
                  {group.label}
                </div>
              )}
              <ul className="space-y-0.5">
                {visible.map((item) => {
                  const Icon = item.icon;
                  const active =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all',
                          active
                            ? 'bg-white/15 text-white shadow-inner'
                            : 'text-white/75 hover:bg-white/10 hover:text-white',
                          collapsed && 'justify-center',
                        )}
                      >
                        <Icon className="w-[18px] h-[18px] shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {!collapsed && currentUser && (
        <div className="border-t border-white/10 p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-sm font-semibold">
            {currentUser.full_name.slice(0, 1)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{currentUser.full_name}</div>
            <div className="text-[11px] text-white/60 truncate">
              {roleLabel[currentUser.role]}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
