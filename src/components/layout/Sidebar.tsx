import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Thermometer, 
  Route, 
  AlertTriangle, 
  BarChart3, 
  Database,
  ChevronLeft,
  ChevronRight,
  Snowflake
} from 'lucide-react';
import { useUIStore } from '@/store';

const navItems = [
  { path: '/', label: '综合驾驶舱', icon: LayoutDashboard },
  { path: '/temperature', label: '温度监控', icon: Thermometer },
  { path: '/route', label: '路线回放', icon: Route },
  { path: '/exception', label: '异常追溯', icon: AlertTriangle },
  { path: '/compare', label: '多维对比', icon: BarChart3 },
  { path: '/data-quality', label: '数据质量', icon: Database },
];

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();

  return (
    <aside 
      className={`fixed left-0 top-0 h-full bg-slate-900 text-white transition-all duration-300 z-40 flex flex-col
        ${sidebarCollapsed ? 'w-16' : 'w-64'}`}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <Snowflake className="w-8 h-8 text-blue-400" />
            <span className="font-bold text-lg">冷链温控</span>
          </div>
        )}
        {sidebarCollapsed && (
          <Snowflake className="w-8 h-8 text-blue-400 mx-auto" />
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1 hover:bg-slate-700 rounded transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 mx-2 rounded-lg mb-1 transition-all
              ${isActive 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
              ${sidebarCollapsed ? 'justify-center' : ''}
            `}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        {!sidebarCollapsed && (
          <div className="text-xs text-slate-400">
            <p>冷链物流温控追踪系统</p>
            <p className="mt-1">v1.0.0</p>
          </div>
        )}
      </div>
    </aside>
  );
}
