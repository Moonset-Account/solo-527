'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FileText,
  Shield,
  Truck,
  MapPin,
  ClipboardCheck,
  Receipt,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { cn, roleLabels } from '@/lib/utils';
import { useAuth, usePermissions } from '@/hooks/useAuth';

const menuItems = [
  { icon: LayoutDashboard, label: '仪表盘', href: '/dashboard', permission: null },
  { icon: Package, label: '展品台账', href: '/exhibits', permission: 'exhibits:read' },
  { icon: FileText, label: '借展合同', href: '/contracts', permission: 'contracts:read' },
  { icon: ClipboardCheck, label: '借展申请', href: '/applications', permission: 'applications:read' },
  { icon: Shield, label: '保险单', href: '/insurance', permission: 'insurance:read' },
  { icon: Truck, label: '运输交接', href: '/transport', permission: 'transport:read' },
  { icon: Package, label: '运输箱', href: '/crates', permission: 'crates:read' },
  { icon: MapPin, label: '布展位置', href: '/locations', permission: 'locations:read' },
  { icon: ClipboardCheck, label: '状况报告', href: '/condition-reports', permission: 'condition_reports:read' },
  { icon: Receipt, label: '月度对账', href: '/reconciliation', permission: 'reconciliation:read' },
  { icon: Bell, label: '通知中心', href: '/notifications', permission: null },
  { icon: Settings, label: '系统设置', href: '/settings', permission: 'all' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { profile, signOut } = useAuth();
  const { can } = usePermissions();

  const filteredItems = menuItems.filter(
    (item) => item.permission === null || can(item.permission)
  );

  return (
    <div
      className={cn(
        'flex h-screen flex-col border-r bg-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">艺术馆借展系统</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 hover:bg-gray-100"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-amber-50 text-amber-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t p-3">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-medium text-sm">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
                <p className="text-xs text-gray-500">{roleLabels[profile?.role || 'viewer']}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="rounded-lg p-1.5 hover:bg-gray-100 text-gray-600"
              title="退出登录"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-medium text-sm">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
