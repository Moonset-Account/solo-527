import { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck2,
  ListTodo,
  Flag,
  BarChart3,
  BrainCircuit,
  Users2,
  Shield,
  Gauge,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { cn } from '@/lib/utils';

interface MenuItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: string[];
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', label: '工作台', icon: LayoutDashboard },
  { path: '/meetings', label: '会议管理', icon: CalendarCheck2 },
  { path: '/workbench', label: '行动项工作台', icon: ListTodo },
  { path: '/milestones', label: '里程碑', icon: Flag },
  { path: '/evaluation', label: '质量评估', icon: BarChart3 },
  { path: '/training', label: '模型训练', icon: BrainCircuit },
];

const adminMenuItems: MenuItem[] = [
  { path: '/admin/users', label: '用户管理', icon: Users2, roles: ['admin', 'reviewer'] },
  { path: '/admin/masking', label: '脱敏规则', icon: Shield, roles: ['admin'] },
  { path: '/admin/monitor', label: '调用监控', icon: Gauge, roles: ['admin'] },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, role, logout } = useAuthStore();
  const navigate = useNavigate();

  const allMenuItems = [
    ...menuItems,
    ...adminMenuItems.filter((item) => !item.roles || (role && item.roles.includes(role))),
  ];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-[#0f1e4d] via-[#1e3a8a] to-[#172554] text-white transition-all duration-300 lg:relative lg:translate-x-0',
          collapsed && 'lg:w-20',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
          <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
            <div className="h-9 w-9 flex-shrink-0 rounded-xl bg-gradient-to-br from-accent-500 to-orange-600 flex items-center justify-center shadow-lg shadow-accent-500/30">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="font-bold text-sm truncate">会议行动项</div>
                <div className="text-[11px] text-blue-200/80 truncate">智能提取平台</div>
              </div>
            )}
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-white/70 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {allMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-white/15 text-white shadow-inner'
                      : 'text-blue-100/80 hover:bg-white/8 hover:text-white'
                  )
                }
              >
                <Icon className={cn('h-5 w-5 flex-shrink-0', collapsed && 'mx-auto')} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 h-6 w-6 items-center justify-center rounded-full bg-white text-[#1e3a8a] shadow-md hover:shadow-lg border border-slate-200"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30">
          <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-base lg:text-lg font-semibold text-slate-800">
                  会议行动项智能提取平台
                </h1>
                <p className="hidden md:block text-xs text-slate-500">AI驱动 · 高效协作 · 可追溯</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent-500 ring-2 ring-white" />
              </button>

              <div className="h-8 w-px bg-slate-200 hidden md:block" />

              <div className="flex items-center gap-3">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-medium text-slate-800">{user?.name || '用户'}</span>
                  <span className="text-[11px] text-slate-500">
                    {role === 'admin' && '系统管理员'}
                    {role === 'manager' && '项目经理'}
                    {role === 'reviewer' && '质量审核员'}
                    {role === 'member' && '团队成员'}
                  </span>
                </div>
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] flex items-center justify-center text-white font-semibold text-sm shadow-md">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="退出登录"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
