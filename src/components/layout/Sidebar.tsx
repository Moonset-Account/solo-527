'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GitBranch,
  BarChart3,
  Table,
  Pill,
} from 'lucide-react';
import { cn } from '@/utils/formatters';

const navItems = [
  { href: '/', label: '运营总览', icon: LayoutDashboard },
  { href: '/bottleneck', label: '瓶颈分析', icon: GitBranch },
  { href: '/comparison', label: '多维对比', icon: BarChart3 },
  { href: '/details', label: '明细查询', icon: Table },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col shadow-sm">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-sm">药房运营</h1>
            <p className="text-xs text-gray-500">瓶颈分析平台</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                isActive
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          <p>数据更新时间</p>
          <p className="font-medium text-gray-700">2024-06-07 11:30</p>
        </div>
      </div>
    </aside>
  );
}
