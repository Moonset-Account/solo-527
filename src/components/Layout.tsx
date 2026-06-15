import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  TicketCheck,
  Server,
  Settings,
  Users,
  Shield,
  Clock,
  Download,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const navItems = [
  { path: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { path: '/tickets', label: '工单管理', icon: TicketCheck },
  { path: '/assets', label: '资产管理', icon: Server },
  { path: '/config-items', label: '配置项管理', icon: Settings },
  { path: '/users', label: '用户管理', icon: Users, roles: ['admin'] },
  { path: '/audit-logs', label: '审计日志', icon: Shield, roles: ['admin', 'manager'] },
  { path: '/sla', label: 'SLA统计', icon: Clock },
  { path: '/exports', label: '导出中心', icon: Download },
];

const breadcrumbMap: Record<string, string> = {
  dashboard: '仪表盘',
  tickets: '工单管理',
  assets: '资产管理',
  'config-items': '配置项管理',
  users: '用户管理',
  'audit-logs': '审计日志',
  sla: 'SLA统计',
  exports: '导出中心',
  create: '新建',
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (!useAuthStore.getState().isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const userRole = user?.role || '';
  const visibleNav = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((seg, i) => {
    const path = '/' + pathSegments.slice(0, i + 1).join('/');
    const label = breadcrumbMap[seg] || seg;
    return { path, label };
  });

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`${
          collapsed ? 'sidebar-collapsed' : 'sidebar-width'
        } bg-[var(--color-sidebar)] flex flex-col transition-all duration-200 shrink-0`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {!collapsed && (
            <span className="text-white font-bold text-lg font-[var(--font-heading)]">
              IT 资产配置库
            </span>
          )}
          <button
            className="text-white/60 hover:text-white p-1 rounded"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          {!collapsed && user && (
            <div className="text-white/50 text-xs truncate mb-2 px-2">
              {user.displayName} ({user.role === 'admin' ? '管理员' : user.role === 'manager' ? 'IT主管' : '值班工程师'})
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>退出登录</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-[var(--color-border)] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((bc, i) => (
              <span key={bc.path} className="flex items-center gap-2">
                {i > 0 && <span className="text-[var(--color-text-secondary)]">/</span>}
                {i === breadcrumbs.length - 1 ? (
                  <span className="text-[var(--color-text)] font-medium">{bc.label}</span>
                ) : (
                  <Link to={bc.path} className="text-[var(--color-primary)] hover:underline">
                    {bc.label}
                  </Link>
                )}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-sm font-bold">
              {user?.displayName?.[0] || 'U'}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-[var(--color-bg)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
