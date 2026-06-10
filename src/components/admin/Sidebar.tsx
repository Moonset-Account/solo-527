'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  MapPin,
  Image,
  Heart,
  AlertTriangle,
  Settings,
  LogOut,
  HeartHandshake,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { ADMIN_NAV_ITEMS } from '@/lib/utils/constants';

const iconMap: Record<string, any> = {
  LayoutDashboard,
  Wallet,
  MapPin,
  Image,
  Heart,
  AlertTriangle,
  Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName];
    return Icon ? <Icon className="w-5 h-5" /> : null;
  };

  return (
    <div className="w-64 bg-gray-900 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="p-2 bg-primary-500 rounded-xl">
            <HeartHandshake className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white font-serif">阳光助学</h1>
            <p className="text-xs text-gray-400">管理后台</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {getIcon(item.icon)}
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="p-4 bg-gray-800 rounded-xl mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.full_name?.charAt(0) || user?.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.full_name || '管理员'}</p>
              <p className="text-xs text-gray-400">{user?.role === 'admin' ? '管理员' : '项目官员'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
