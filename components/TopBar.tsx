'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
  User,
  Droplets,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { roleLabel, cn } from '@/lib/utils';

export function TopBar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const logout = useAppStore((s) => s.logout);
  const currentUser = useAppStore((s) => s.currentUser);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-20">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className="w-9 h-9 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 transition"
          aria-label="toggle sidebar"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
        <button className="md:hidden w-9 h-9 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 transition">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 mr-2 text-xs text-slate-500">
          <Droplets className="w-3.5 h-3.5 text-brand-500" />
          <span>今日门店运营状态良好</span>
        </div>
        <button className="relative w-9 h-9 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 transition">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-500" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-slate-100 transition"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-sm font-semibold">
              {currentUser?.full_name?.slice(0, 1) ?? 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-slate-800 leading-tight">
                {currentUser?.full_name}
              </div>
              <div className="text-[11px] text-slate-500 leading-tight">
                {currentUser ? roleLabel[currentUser.role] : ''}
              </div>
            </div>
          </button>

          {menuOpen && (
            <div
              className={cn(
                'absolute right-0 top-11 w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-30 animate-fade-in',
              )}
            >
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="text-sm font-medium text-slate-800">{currentUser?.full_name}</div>
                <div className="text-[11px] text-slate-500">{currentUser?.email}</div>
              </div>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <User className="w-4 h-4" />
                个人资料
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
