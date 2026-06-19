import { createRootRoute, Outlet, Link } from '@tanstack/react-router';
import { LayoutDashboard, FileUp, AlertTriangle, Clock, Tag } from 'lucide-react';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-slate-700">
          <h1 className="text-lg font-bold tracking-tight">新闻稿件复盘</h1>
          <p className="text-xs text-slate-400 mt-0.5">数据复盘看板</p>
        </div>
        <nav className="flex-1 py-3">
          <NavItem to="/" icon={<LayoutDashboard size={18} />} label="数据看板" />
          <NavItem to="/materials" icon={<FileUp size={18} />} label="素材管理" />
          <NavItem to="/exceptions" icon={<AlertTriangle size={18} />} label="异常处理" />
          <NavItem to="/history" icon={<Clock size={18} />} label="操作历史" />
          <NavItem to="/tags" icon={<Tag size={18} />} label="标签管理" />
        </nav>
        <div className="px-5 py-3 border-t border-slate-700 text-xs text-slate-400">
          编辑主管工作台
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-5 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
      activeProps={{ className: 'bg-slate-800 text-white' }}
    >
      {icon}
      {label}
    </Link>
  );
}
