import { Link, useNavigate, useLocation } from '@tanstack/react-router';
import { useAuthStore } from '@/store/authStore';
import { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  const menuItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/apartments', label: '房源管理', icon: '🏢' },
    { path: '/customers', label: '客户管理', icon: '👥' },
    { path: '/viewings', label: '看房预约', icon: '📅' },
    { path: '/followups', label: '跟进记录', icon: '📝' },
    { path: '/leases', label: '租约管理', icon: '📄' },
    { path: '/deposits', label: '押金管理', icon: '💰' },
    { path: '/reminders', label: '空置提醒', icon: '🔔' },
    { path: '/todos', label: '待办事项', icon: '✅' },
    { path: '/search', label: '综合查询', icon: '🔍' },
  ];

  const adminMenuItems = [
    { path: '/reports', label: '统计报表', icon: '📊' },
    { path: '/users', label: '用户管理', icon: '👤' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">长租公寓管理</h1>
          <p className="text-sm text-gray-500">v1.0.0</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
            
            {user?.role === 'admin' && (
              <>
                <li className="pt-4 pb-2">
                  <span className="px-4 text-xs font-semibold text-gray-400 uppercase">系统管理</span>
                </li>
                {adminMenuItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </>
            )}
          </ul>
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0)}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500">
                  {user?.role === 'admin' ? '管理员' : '顾问'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600"
              title="退出登录"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
