'use client';

import { Bell, Search, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useRouter } from 'next/navigation';

export function AdminHeader() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { currentPageTitle } = useUIStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-dark-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="text-lg font-semibold text-dark-900 font-display">
        {currentPageTitle}
      </h1>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400" />
          <input
            type="text"
            placeholder="搜索..."
            className="pl-9 pr-4 py-2 w-64 border border-dark-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <button className="p-2 rounded-lg text-dark-500 hover:text-dark-700 hover:bg-dark-100 transition-colors relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-dark-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-dark-900">{user?.name}</div>
              <div className="text-xs text-dark-500">管理员</div>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-dark-200 py-1 z-50">
              <button className="w-full px-4 py-2 text-left text-sm text-dark-700 hover:bg-dark-50 flex items-center gap-2">
                <User className="h-4 w-4" />
                个人资料
              </button>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
