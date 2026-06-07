import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  LineChart,
  Database,
  FileDown,
  Droplets,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '../../store/useFilterStore';

const navItems = [
  { path: '/', label: '总览仪表盘', icon: LayoutDashboard },
  { path: '/map', label: '地图监测', icon: Map },
  { path: '/trends', label: '趋势分析', icon: LineChart },
  { path: '/data-management', label: '数据管理', icon: Database, adminOnly: true },
  { path: '/export', label: '报告导出', icon: FileDown },
];

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuthStore();

  return (
    <div className="w-60 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Droplets className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg">水质监测系统</h1>
            <p className="text-xs text-slate-400">River Water Quality</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            if (item.adminOnly && user?.role !== 'admin') return null;
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-sm font-bold">
            {user?.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.username}</p>
            <p className="text-xs text-slate-400 truncate">{user?.organization}</p>
          </div>
          <button className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
