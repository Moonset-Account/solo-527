import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarClock,
  AlertTriangle,
  Users,
  Database,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { useDashboardStore } from '../../store/useDashboardStore';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '仪表盘概览' },
  { path: '/reservation', icon: CalendarClock, label: '预约分析' },
  { path: '/overdue', icon: AlertTriangle, label: '逾期分析' },
  { path: '/readers', icon: Users, label: '读者分析' },
  { path: '/data-quality', icon: Database, label: '数据质量' },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useDashboardStore();

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-primary-800 text-white transition-all duration-300 z-40 flex flex-col ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-primary-700">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-accent-400" />
            <span className="font-display text-lg font-semibold">图书馆分析</span>
          </div>
        )}
        {!sidebarOpen && <BookOpen className="w-6 h-6 text-accent-400 mx-auto" />}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-primary-700 transition-colors"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 py-4 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {sidebarOpen && (
        <div className="p-4 border-t border-primary-700">
          <div className="text-xs text-primary-300">
            <p>数据更新时间</p>
            <p className="text-primary-200 mt-1">2026-06-07 08:00</p>
          </div>
        </div>
      )}
    </aside>
  );
}
