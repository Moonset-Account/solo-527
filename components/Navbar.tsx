'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavbarProps {
  pendingCount: number;
}

export default function Navbar({ pendingCount }: NavbarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '渠道质量', icon: BarChart3 },
    { 
      href: '/review', 
      label: '复核队列', 
      icon: ClipboardCheck,
      badge: pendingCount,
    },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">问卷质量监控</span>
            </Link>

            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold text-white bg-red-500 animate-pulse">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-700">
                  <span className="font-bold">{pendingCount}</span> 条待复核
                </span>
              </div>
            )}
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">管</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
