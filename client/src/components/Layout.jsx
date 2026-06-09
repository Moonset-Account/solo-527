import React from 'react';
import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', icon: '📊', label: '仪表盘', roles: ['admin', 'assistant', 'reviewer'] },
  { path: '/contracts', icon: '📁', label: '合同管理', roles: ['admin', 'assistant', 'reviewer'] },
  { path: '/review-queue', icon: '🔍', label: '二审队列', roles: ['admin', 'reviewer'] },
  { path: '/clause-lists', icon: '📝', label: '条款清单', roles: ['admin', 'reviewer'] },
  { path: '/alerts', icon: '🚨', label: '告警中心', roles: ['admin', 'reviewer'] },
  { path: '/audit', icon: '📜', label: '审计日志', roles: ['admin', 'reviewer'] },
];

const Layout = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const pageTitles = {
    '/dashboard': '仪表盘',
    '/contracts': '合同管理',
    '/review-queue': '二审复核队列',
    '/clause-lists': '条款清单',
    '/alerts': '告警中心',
    '/audit': '审计日志',
  };

  const getTitle = () => {
    for (const [path, title] of Object.entries(pageTitles)) {
      if (location.pathname.startsWith(path)) return title;
    }
    if (location.pathname.startsWith('/contract/')) return '合同详情';
    return '合同风险标注系统';
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span style={{ fontSize: 24 }}>📋</span>
          <h1>合同风险标注</h1>
        </div>

        <nav className="sidebar-nav">
          {navItems
            .filter(item => hasRole(...item.roles))
            .map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
        </nav>

        <div className="sidebar-user">
          <div className="avatar">
            {user?.full_name ? user.full_name[0] : 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="font-medium truncate">{user?.full_name}</div>
            <div className="text-xs text-muted">
              {user?.role === 'admin' ? '管理员' : user?.role === 'reviewer' ? '复核人' : '法务助理'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-sm btn-secondary"
            title="退出登录"
            style={{ padding: '4px 8px' }}
          >
            🚪
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-title">{getTitle()}</div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-secondary">
              👤 {user?.full_name}
            </span>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
