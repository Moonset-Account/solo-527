import { Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import { useAuthStore } from '../../store/auth';
import { useState } from 'react';

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  roles: string[];
}

const menuItems: MenuItem[] = [
  { path: '/', label: '首页概览', icon: '📊', roles: ['staff', 'admin', 'coach_supervisor', 'manager'] },
  { path: '/devices', label: '设备管理', icon: '⚙️', roles: ['admin', 'staff'] },
  { path: '/inspections', label: '巡检记录', icon: '📋', roles: ['staff', 'admin'] },
  { path: '/repairs', label: '维修工单', icon: '🔧', roles: ['admin', 'staff'] },
  { path: '/schedules', label: '教练排班', icon: '📅', roles: ['coach_supervisor', 'admin'] },
  { path: '/pricing', label: '价格规则', icon: '💰', roles: ['coach_supervisor', 'admin'] },
  { path: '/waitlist', label: '候补名单', icon: '📝', roles: ['coach_supervisor', 'admin'] },
  { path: '/events', label: '赛事管理', icon: '🏆', roles: ['manager', 'admin'] },
  { path: '/reports', label: '统计报表', icon: '📈', roles: ['manager', 'admin'] },
  { path: '/logs', label: '操作日志', icon: '📜', roles: ['admin'] },
];

const roleLabels: Record<string, string> = {
  staff: '前台员工',
  admin: '管理员',
  coach_supervisor: '教练主管',
  manager: '负责人',
};

export function RootLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return <Outlet />;
  }

  const filteredMenu = menuItems.filter((item) => user?.role && item.roles.includes(user.role));

  const handleLogout = async () => {
    await logout();
    navigate({ to: '/login' });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <span className="text-xl font-bold text-primary-600">
            {sidebarOpen ? '游泳馆管理系统' : '🏊'}
          </span>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {filteredMenu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate({ to: item.path as any })}
                className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-500'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl mr-3">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full text-center text-gray-500 hover:text-gray-700 py-2"
          >
            {sidebarOpen ? '« 收起' : '»'}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-gray-800">
            {filteredMenu.find((m) => m.path === location.pathname)?.label || '游泳馆设备巡检管理系统'}
          </h1>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">{user.name}</p>
                  <p className="text-xs text-gray-500">{roleLabels[user.role] || user.role}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium">
                  {user.name.charAt(0)}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-red-500 transition-colors"
                >
                  退出
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
