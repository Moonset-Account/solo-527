import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Network,
  Users,
  MessageSquare,
  Database,
  List,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

const navItems = [
  { path: '/', label: '仪表盘概览', icon: LayoutDashboard },
  { path: '/efficiency', label: '流程效率分析', icon: TrendingUp },
  { path: '/channel', label: '渠道质量分析', icon: Network },
  { path: '/interviewer', label: '面试官负载', icon: Users },
  { path: '/feedback', label: '候选人反馈', icon: MessageSquare },
  { path: '/records', label: '原始记录', icon: List },
  { path: '/data', label: '数据管理', icon: Database },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-slate-900 text-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-slate-700 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600" />
            <span className="text-lg font-bold">招聘分析</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="mt-4 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all',
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon size={20} />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="absolute bottom-4 left-2 right-2 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
          <p className="text-xs text-slate-400">人事运营平台</p>
          <p className="mt-1 text-xs text-slate-500">v1.0.0</p>
        </div>
      )}
    </aside>
  );
}
