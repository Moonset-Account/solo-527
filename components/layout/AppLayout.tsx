'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Map,
  LineChart,
  Database,
  FileDown,
  Droplets,
  LogOut,
  Shield,
  Building2,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useEffect } from 'react';

const navItems = [
  { path: '/dashboard', label: '总览仪表盘', icon: LayoutDashboard },
  { path: '/map', label: '地图监测', icon: Map },
  { path: '/trends', label: '趋势分析', icon: LineChart },
  { path: '/data-management', label: '数据管理', icon: Database, adminOnly: true },
  { path: '/export', label: '报告导出', icon: FileDown },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, pathname, router]);

  const handleLogout = async () => {
    logout();
    router.push('/login');
  };

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <div className="w-60 bg-slate-900 text-white min-h-screen flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">水质监测系统</h1>
              <p className="text-xs text-slate-400">River Water Quality</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              if (item.adminOnly && user?.role !== 'admin') return null;
              const isActive = pathname === item.path;
              const Icon = item.icon;

              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-sm font-bold shadow-lg">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.username}</p>
              <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {user?.organization}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
              user?.role === 'admin'
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-cyan-500/20 text-cyan-300'
            }`}>
              <Shield className="w-3 h-3" />
              {user?.role === 'admin' ? '管理员' : '研究员'}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-700 transition-colors"
              title="退出登录"
            >
              <LogOut className="w-3.5 h-3.5" />
              退出
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto p-6 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
