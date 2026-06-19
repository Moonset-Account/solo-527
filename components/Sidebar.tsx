'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  FileClock,
  FileText,
  AlertTriangle,
  Settings2,
  History,
  Boxes,
  ClipboardCheck,
  Headphones,
  BarChart3,
  SlidersHorizontal,
  ChevronsLeft,
  ChevronsRight,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

const navItems = [
  { key: 'dashboard', label: '进度看板', icon: LayoutDashboard, href: '/' },
  {
    key: 'projects',
    label: '项目管理',
    icon: FolderKanban,
    href: '/',
  },
  { key: 'delays', label: '延期维护', icon: AlertTriangle, href: '/delays' },
  { key: 'rules', label: '提醒规则', icon: Settings2, href: '/rules' },
  { key: 'versions', label: '版本管理', icon: History, href: '/rules/versions' },
  { key: 'schemes', label: '装修方案', icon: Boxes, href: '/schemes' },
  { key: 'inspections', label: '巡检任务', icon: ClipboardCheck, href: '/inspections' },
  { key: 'after-sales', label: '售后报修', icon: Headphones, href: '/after-sales' },
  { key: 'reports', label: '月度复盘', icon: BarChart3, href: '/reports/monthly' },
  { key: 'quotations', label: '报价与增项', icon: FileText, href: '/projects/p-001/quotation' },
  { key: 'settings', label: '个人配置', icon: SlidersHorizontal, href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-zinc-200 bg-white transition-all duration-200',
        sidebarCollapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-zinc-100 px-4">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-700 text-white">
              <FileClock className="h-4 w-4" />
            </div>
            <span className="font-serif text-base font-semibold text-zinc-900">
              装修进度看板
            </span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="flex h-8 w-8 items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          aria-label="toggle sidebar"
        >
          {sidebarCollapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-brand-50 text-brand-700 font-medium'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
                    sidebarCollapsed && 'justify-center px-0'
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-zinc-100 p-3">
        <div
          className={cn(
            'flex items-center gap-3 rounded px-2 py-2',
            sidebarCollapsed && 'justify-center px-0'
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <User className="h-4 w-4" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-zinc-900">
                {useAppStore.getState().currentUser.full_name}
              </div>
              <div className="truncate text-xs text-zinc-500">
                {useAppStore.getState().currentUser.role === 'admin'
                  ? '管理员'
                  : useAppStore.getState().currentUser.role === 'project_manager'
                  ? '项目经理'
                  : '客户'}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
