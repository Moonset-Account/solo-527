import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileSpreadsheet, Bell, Settings, BarChart3, LogOut, User } from 'lucide-react';
import useAuthStore from '@/stores/auth';

const navItems = [
  { to: '/', label: '首页', icon: LayoutDashboard },
  { to: '/reconciliation', label: '对账单', icon: FileSpreadsheet },
  { to: '/reminders', label: '催收管理', icon: Bell },
  { to: '/config', label: '配置中心', icon: Settings },
  { to: '/reports', label: '明细报表', icon: BarChart3 },
];

const breadcrumbMap: Record<string, string> = {
  '/': '首页',
  '/reconciliation': '对账单管理',
  '/reconciliation/upload': '对账单上传',
  '/reminders': '催收管理',
  '/reminders/config': '催收节奏配置',
  '/config': '配置中心',
  '/config/changelog': '变更日志',
  '/reports': '明细报表',
};

function getBreadcrumbs(pathname: string) {
  const crumbs: Array<{ label: string; to: string }> = [];
  const paths = pathname.split('/').filter(Boolean);
  let current = '';
  for (const segment of paths) {
    current += `/${segment}`;
    const label = breadcrumbMap[current] || segment;
    crumbs.push({ label, to: current });
  }
  return [{ label: '首页', to: '/' }, ...crumbs.slice(1)];
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-60 flex-shrink-0 flex flex-col" style={{ backgroundColor: '#1e293b' }}>
        <div className="px-5 py-6 flex items-center gap-3">
          <FileSpreadsheet className="w-7 h-7 text-amber-400" />
          <span className="text-white text-lg font-bold tracking-wide">对账管理系统</span>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/10 text-amber-400'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-4 border-t border-slate-600 pt-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
              <User className="w-4 h-4 text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{user?.username || '用户'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white w-full transition-colors mt-1"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        <header className="h-12 flex items-center px-6 bg-white border-b border-gray-200 flex-shrink-0">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            {breadcrumbs.map((crumb, idx) => (
              <span key={crumb.to} className="flex items-center gap-1.5">
                {idx > 0 && <span className="text-gray-300">/</span>}
                {idx === breadcrumbs.length - 1 ? (
                  <span className="text-gray-900 font-medium">{crumb.label}</span>
                ) : (
                  <NavLink to={crumb.to} className="hover:text-gray-700 transition-colors">
                    {crumb.label}
                  </NavLink>
                )}
              </span>
            ))}
          </nav>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
