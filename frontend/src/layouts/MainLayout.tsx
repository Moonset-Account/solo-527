import React, { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { userRoleText, UserRole } from '../utils/constants';

interface Props {
  children: ReactNode;
}

export default function MainLayout({ children }: Props) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { to: '/', label: '工作台', icon: '📊', roles: ['admin', 'photographer', 'blogger', 'client'] },
    { to: '/market', label: '素材市场', icon: '🛒', roles: ['admin', 'photographer', 'blogger', 'client'] },
    { to: '/materials', label: '素材管理', icon: '🖼️', roles: ['admin', 'photographer'] },
    { to: '/orders', label: '订单管理', icon: '📦', roles: ['admin', 'photographer', 'client'] },
    { to: '/settlements', label: '收入结算', icon: '💰', roles: ['admin', 'photographer'] },
    { to: '/exceptions', label: '异常处理', icon: '⚠️', roles: ['admin', 'blogger'] },
    { to: '/statistics', label: '统计报表', icon: '📈', roles: ['admin', 'photographer'] },
    { to: '/users', label: '用户管理', icon: '👥', roles: ['admin'] },
  ];

  const visibleMenu = menuItems.filter((m) => user && m.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📸</span>
            <span className="font-bold text-lg text-slate-800">收入结算台</span>
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
          {visibleMenu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-slate-50">
            <div className="w-9 h-9 rounded-full bg-primary-500 text-white flex items-center justify-center font-medium">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-800 truncate">{user?.name}</div>
              <div className="text-xs text-slate-500">{userRoleText(user?.role || '')}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            🚪 退出登录
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-slate-800">
            {visibleMenu.find((m) => window.location.pathname === m.to || (m.to !== '/' && window.location.pathname.startsWith(m.to)))?.label || '工作台'}
          </h1>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>欢迎回来，{user?.name}</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 scrollbar-thin">
          {children}
        </div>
      </main>
    </div>
  );
}
