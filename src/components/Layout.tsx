import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Calendar, ClipboardList, BarChart3, Download, FileText, User } from 'lucide-react';
import { useStore } from '@/store';

const navItems = [
  { to: '/', label: '仪表盘', icon: LayoutDashboard },
  { to: '/scheduling', label: '排班管理', icon: Calendar },
  { to: '/appointments', label: '预约管理', icon: ClipboardList },
  { to: '/review', label: '业务复盘', icon: BarChart3 },
  { to: '/export', label: '数据导出', icon: Download },
  { to: '/audit-log', label: '操作留痕', icon: FileText },
];

export default function Layout() {
  const currentOperator = useStore((s) => s.currentOperator);

  return (
    <div className="flex h-screen bg-zinc-50">
      <aside className="w-60 bg-white border-r border-zinc-200 flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-zinc-200">
          <h1 className="text-lg font-bold text-primary">口腔洁牙排班管理</h1>
          <p className="text-xs text-zinc-400 mt-1">Dental Scheduling System</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-zinc-200">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <User className="w-4 h-4" />
            <span>{currentOperator.name}</span>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-6 shrink-0">
          <span className="text-sm text-zinc-500">口腔洁牙排班管理系统</span>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <User className="w-4 h-4" />
            <span>当前操作者: {currentOperator.name}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
