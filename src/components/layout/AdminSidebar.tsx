'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Wrench,
  ClipboardList,
  Package,
  FileText,
  RefreshCw,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';

const menuItems = [
  { icon: LayoutDashboard, label: '仪表盘', href: '/admin' },
  { icon: Users, label: '技师工位', href: '/admin/technicians' },
  { icon: ClipboardList, label: '检测模板', href: '/admin/templates' },
  { icon: Package, label: '配件管理', href: '/admin/parts' },
  { icon: FileText, label: '收银单', href: '/admin/invoices' },
  { icon: RefreshCw, label: '返修追踪', href: '/admin/repairs' },
  { icon: BarChart3, label: '数据报表', href: '/admin/reports' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-dark-900 transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-dark-700">
        {sidebarOpen && (
          <span className="text-xl font-bold text-white font-display">
            维保后台
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav className="p-2 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-dark-300 hover:text-white hover:bg-dark-800',
                !sidebarOpen && 'justify-center'
              )}
              title={!sidebarOpen ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-dark-700">
        <button
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 transition-colors',
            !sidebarOpen && 'justify-center'
          )}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {sidebarOpen && <span className="text-sm font-medium">设置</span>}
        </button>
      </div>
    </aside>
  );
}
