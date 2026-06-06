import { Link, useLocation } from '@remix-run/react';
import { useAuth } from '~/utils/auth';
import { isOnlineStatus } from '~/utils/offline';
import { useEffect, useState } from 'react';

const statusLabels: Record<string, string> = {
  supervisor: '督导',
  store_manager: '店长',
  regional_manager: '区域经理'
};

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [online, setOnline] = useState(isOnlineStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setOnline(isOnlineStatus());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!user) {
    return <>{children}</>;
  }

  const navItems = [
    { path: '/dashboard', label: '工作台', roles: ['supervisor', 'store_manager', 'regional_manager'] },
    { path: '/issues', label: '问题列表', roles: ['supervisor', 'store_manager', 'regional_manager'] },
    { path: '/issues/new', label: '提交问题', roles: ['supervisor'] },
    { path: '/stores', label: '门店管理', roles: ['regional_manager', 'supervisor'] },
    { path: '/reports', label: '区域报表', roles: ['regional_manager', 'supervisor'] },
    { path: '/offline', label: '离线任务', roles: ['supervisor', 'store_manager'] }
  ].filter(item => item.roles.includes(user.role));

  return (
    <div>
      {!online && (
        <div className="offline-banner">
          ⚠️ 当前处于离线状态，提交的数据将在恢复网络后自动同步
        </div>
      )}
      <header className="header">
        <div className="container">
          <nav className="nav">
            <div className="nav-brand">🏪 门店巡检平台</div>
            <div className="nav-menu">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${location.pathname.startsWith(item.path) && item.path !== '/dashboard' ? 'active' : 
                    location.pathname === item.path ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="nav-user">
              <span className="text-muted text-sm">
                {user.full_name} ({statusLabels[user.role]})
              </span>
              <button 
                className="btn btn-default btn-sm"
                onClick={() => logout()}
              >
                退出
              </button>
            </div>
          </nav>
        </div>
      </header>
      <main className="container" style={{ padding: '24px 20px' }}>
        {children}
      </main>
    </div>
  );
}
