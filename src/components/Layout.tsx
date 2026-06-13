import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  PieChart,
  QrCode,
  Download,
  Layers,
  Bell,
  Menu,
  X,
  User,
} from 'lucide-react';
import { useAppStore } from '@/store';

const navItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/repair/submit', label: '报修申请', icon: FileText },
  { path: '/review', label: '审核管理', icon: ClipboardCheck },
  { path: '/quota', label: '名额管理', icon: PieChart },
  { path: '/checkin', label: '签到管理', icon: QrCode },
  { path: '/details', label: '明细导出', icon: Download },
  { path: '/batch', label: '批量处理', icon: Layers },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const notifications = useAppStore((s) => s.notifications);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex h-screen bg-slate-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <h1 className="text-lg font-bold tracking-wide">宿舍报修审核系统</h1>
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-2 flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-slate-600 hover:text-slate-900"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-slate-800">
              {navItems.find((item) =>
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path),
              )?.label || '宿舍报修审核系统'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative text-slate-500 hover:text-slate-700">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                <User size={16} />
              </div>
              <span className="hidden text-sm font-medium text-slate-700 sm:inline">管理员</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
