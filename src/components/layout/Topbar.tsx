'use client';

import {
  Bell,
  Search,
  LogOut,
  UserCircle2,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useSession } from '@/components/providers/SessionProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { ROLE_LABEL } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

interface Props {
  user: {
    name: string;
    role: string;
    username: string;
    department?: string | null;
  };
}

export function Topbar({ user }: Props) {
  const { logout } = useSession();
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast('已安全退出登录', 'info');
  };

  const roleInfo = ROLE_LABEL[user.role] || ROLE_LABEL.USER;

  return (
    <header className="glass-nav sticky top-0 z-30">
      <div className="h-16 px-6 flex items-center justify-between gap-4">
        {/* 左侧搜索 */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              placeholder="快速搜索待办事项、责任人..."
              className="input-base pl-10 py-2 bg-slate-50/80 border-slate-200/70"
            />
          </div>
        </div>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-2 ml-auto">
          <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200/70 hover:bg-amber-100 transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            <span>当前周期：第24周</span>
          </button>

          <button className="relative w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-primary transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-danger ring-2 ring-white" />
          </button>

          {/* 用户菜单 */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent text-white text-xs font-bold flex items-center justify-center">
                {user.name.slice(0, 1)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-slate-800 leading-tight">
                  {user.name}
                </div>
                <div className={`text-[10px] leading-tight ${roleInfo.className.replace('bg-', 'text-').split(' ')[0]}`}>
                  {roleInfo.label}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-hover border border-slate-100 bg-white py-2 animate-fade-in z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent text-white font-bold flex items-center justify-center">
                      {user.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        {user.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        @{user.username}
                      </div>
                    </div>
                  </div>
                </div>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                  <UserCircle2 className="w-4 h-4 text-slate-400" />
                  个人设置
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
