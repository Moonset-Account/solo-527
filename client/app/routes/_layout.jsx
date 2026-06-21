import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from '@remix-run/react';
import { getUser, removeToken } from '~/utils/api';

const menuItems = [
  { path: '/', label: '工作台', icon: '📊', roles: ['leader', 'operator', 'admin'] },
  { path: '/schedules', label: '志愿排班', icon: '📅', roles: ['leader', 'operator', 'admin'] },
  { path: '/checkins', label: '签到管理', icon: '✅', roles: ['leader', 'operator', 'admin'] },
  { path: '/feedbacks', label: '反馈审核', icon: '💬', roles: ['leader', 'operator', 'admin'] },
  { path: '/donations', label: '捐赠明细', icon: '💝', roles: ['leader', 'operator', 'admin'] },
  { path: '/absences', label: '缺席处理', icon: '⚠️', roles: ['leader', 'operator', 'admin'] },
  { path: '/alerts', label: '预警中心', icon: '🔔', roles: ['leader', 'operator', 'admin'] },
  { path: '/activities', label: '活动管理', icon: '🎯', roles: ['operator', 'admin'] },
  { path: '/volunteers', label: '志愿者管理', icon: '👥', roles: ['operator', 'admin'] },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      navigate('/login');
    } else {
      setUser(currentUser);
    }
  }, [navigate]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          志愿活动看板
        </div>
        
        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            {filteredMenu.map(item => (
              <li key={item.path} className="sidebar-menu-item">
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => 
                    `sidebar-menu-link ${isActive ? 'active' : ''}`
                  }
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user.name?.charAt(0) || 'U'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">
                {user.role === 'admin' ? '管理员' : 
                 user.role === 'leader' ? '志愿者队长' : '运营人员'}
              </div>
            </div>
            <button 
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '1rem' }}
              title="退出登录"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <h1 className="header-title">
              {filteredMenu.find(m => m.path === location.pathname)?.label || 
               filteredMenu.find(m => location.pathname.startsWith(m.path) && m.path !== '/')?.label ||
               '工作台'}
            </h1>
          </div>
          <div className="header-actions">
            <span className="badge badge-info">
              {user.team || '未分配团队'}
            </span>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>

      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 40
          }}
        />
      )}
    </div>
  );
}
