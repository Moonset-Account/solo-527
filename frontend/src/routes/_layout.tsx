import { createFileRoute, Outlet, redirect, Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useAuthStore, roleLabels, roleColors } from '@/store/auth';
import { LayoutDashboard, ClipboardList, PackageSearch, Clock, Download, ShieldAlert, Users, LogOut, Leaf } from 'lucide-react';
import { classNames } from '@/lib/format';
import { useState } from 'react';
import clsx from 'clsx';

const navItems = [
  { to: '/dashboard', label: '物料齐套看板', icon: LayoutDashboard, roles: ['admin', 'planner', 'equipment_supervisor'] },
  { to: '/work-orders', label: '工单管理', icon: ClipboardList, roles: ['admin', 'planner', 'equipment_supervisor'] },
  { to: '/materials', label: '物料与缺料', icon: PackageSearch, roles: ['admin', 'planner', 'equipment_supervisor'] },
  { to: '/timeline', label: '生产时间线', icon: Clock, roles: ['admin', 'planner', 'equipment_supervisor'] },
  { to: '/reworks', label: '返工与超时', icon: ShieldAlert, roles: ['admin', 'planner', 'equipment_supervisor'] },
  { to: '/exports', label: '导出记录', icon: Download, roles: ['admin', 'planner', 'equipment_supervisor'] },
  { to: '/users', label: '用户权限', icon: Users, roles: ['admin'] },
];

export const Route = createFileRoute('/_layout')({
  beforeLoad: ({ context }) => {
    const token = useAuthStore.getState().token;
    if (!token) throw redirect({ to: '/login' });
  },
  component: LayoutComponent,
});

function LayoutComponent() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const visibleNavItems = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-60 border-r border-slate-200 bg-white flex-shrink-0 flex flex-col">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-200">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white">
            <Leaf size={20} />
          </div>
          <div>
            <div className="font-semibold text-slate-800 leading-tight">青禾工序排程台</div>
            <div className="text-[11px] text-slate-500">QingHe Scheduling</div>
          </div>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
            return (
              <Link
                key={item.to}
                to={item.to}
                className={clsx(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon size={18} className={classNames(active ? 'text-brand-600' : 'text-slate-400')} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-200">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                {user?.realName?.slice(0, 1) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">{user?.realName}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={clsx('badge', roleColors[user?.role || 'planner'])}>
                    {roleLabels[user?.role || 'planner']}
                  </span>
                </div>
              </div>
            </button>
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-50">
                <button
                  onClick={() => {
                    logout();
                    setUserMenuOpen(false);
                    navigate({ to: '/login' });
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 border-t border-slate-100"
                >
                  <LogOut size={16} /> 退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
