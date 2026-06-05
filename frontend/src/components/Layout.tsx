import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { path: '/dashboard', label: '仪表盘', icon: '📊', roles: ['member', 'operator', 'admin'] },
  { path: '/equipment', label: '设备档案', icon: '🚜', roles: ['member', 'operator', 'admin'] },
  { path: '/fields', label: '地块地图', icon: '🗺️', roles: ['member', 'operator', 'admin'] },
  { path: '/reservations', label: '预约管理', icon: '📅', roles: ['member', 'operator', 'admin'] },
  { path: '/work', label: '作业执行', icon: '👷', roles: ['operator', 'admin'] },
  { path: '/maintenance', label: '维修工单', icon: '🔧', roles: ['operator', 'admin'] },
  { path: '/settlement', label: '结算中心', icon: '💰', roles: ['member', 'admin'] },
  { path: '/audit', label: '审计日志', icon: '📋', roles: ['admin'] },
];

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  const roleLabels: Record<string, string> = {
    admin: '管理员',
    member: '社员',
    operator: '机手'
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-white text-xl">
              🌾
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-serif font-bold text-lg text-primary-600">农机共享</h1>
                <p className="text-xs text-gray-500">智慧农业平台</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {filteredMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                location.pathname.startsWith(item.path)
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium">
              {user?.name?.charAt(0) || 'U'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user?.name}</p>
                <p className="text-xs text-gray-500">{roleLabels[user?.role || '']}</p>
              </div>
            )}
            {sidebarOpen && (
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="退出登录"
              >
                🚪
              </button>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
          >
            ☰
          </button>
          
          <div className="flex items-center gap-4">
            {user?.role === 'member' && (
              <div className="flex items-center gap-2 bg-gold-50 px-3 py-1.5 rounded-full">
                <span className="text-gold-600">⭐</span>
                <span className="text-sm font-medium text-gold-700">{user.points} 积分</span>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
