import { useState, useEffect, ReactNode } from 'react';
import { NavLink, useNavigate, useLocation } from '@remix-run/react';

interface LayoutProps {
  children: ReactNode;
}

interface User {
  _id: string;
  username: string;
  name: string;
  role: string;
  store?: any;
}

export default function AppLayout({ children }: LayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [reminderCount, setReminderCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    } else {
      navigate('/login');
    }

    const handleStorage = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [navigate]);

  useEffect(() => {
    fetchReminderCount();
  }, []);

  const fetchReminderCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const res = await fetch('/api/reminders?status=pending&pageSize=1', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setReminderCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { key: '/dashboard', label: '仪表盘', icon: '📊', roles: ['admin', 'manager', 'store_manager', 'staff'] },
    { key: '/stores', label: '门店管理', icon: '🏪', roles: ['admin', 'manager'] },
    { key: '/users', label: '用户管理', icon: '👥', roles: ['admin', 'manager'] },
    { key: '/business', label: '营业数据', icon: '💰', roles: ['admin', 'manager', 'store_manager', 'staff'] },
    { key: '/anomalies', label: '异常记录', icon: '⚠️', roles: ['admin', 'manager', 'store_manager', 'staff'] },
    { key: '/rectifications', label: '整改任务', icon: '📋', roles: ['admin', 'manager', 'store_manager', 'staff'] },
    { key: '/inspections', label: '巡店任务', icon: '🔍', roles: ['admin', 'manager', 'store_manager'] },
    { key: '/inventory', label: '食材库存', icon: '📦', roles: ['admin', 'manager', 'store_manager', 'staff'] },
    { key: '/coupons', label: '会员券包', icon: '🎫', roles: ['admin', 'manager', 'store_manager'] },
    { key: '/cash-differences', label: '现金差异', icon: '💵', roles: ['admin', 'manager', 'store_manager'] },
    { key: '/reminders', label: '催办提醒', icon: '🔔', roles: ['admin', 'manager', 'store_manager', 'staff'] },
    { key: '/logs', label: '操作日志', icon: '📝', roles: ['admin', 'manager'] },
  ];

  const visibleMenuItems = menuItems.filter(item => user?.role && item.roles.includes(user.role));

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">🍵 茶饮巡店系统</div>
        <ul className="sidebar-menu">
          {visibleMenuItems.map(item => (
            <li key={item.key} className={location.pathname.startsWith(item.key) ? 'active' : ''}>
              <NavLink to={item.key}>
                <span>{item.icon}</span> {item.label}
                {item.key === '/reminders' && reminderCount > 0 && (
                  <span style={{ 
                    marginLeft: '8px', 
                    background: '#f56c6c', 
                    color: 'white', 
                    borderRadius: '10px', 
                    padding: '2px 6px', 
                    fontSize: '10px' 
                  }}>
                    {reminderCount}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </aside>

      <div className="main-content">
        <header className="header">
          <div style={{ fontSize: '16px', fontWeight: '500' }}>
            {visibleMenuItems.find(item => location.pathname.startsWith(item.key))?.label || '系统'}
          </div>
          <div className="header-right">
            <div className="badge" style={{ cursor: 'pointer' }} onClick={() => navigate('/reminders')}>
              <span style={{ fontSize: '20px' }}>🔔</span>
              {reminderCount > 0 && <span className="badge-dot"></span>}
            </div>
            <div className="dropdown">
              <div className="header-user" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <div className="user-avatar">{user?.name?.charAt(0) || 'U'}</div>
                <span>{user?.name}</span>
                <span>▼</span>
              </div>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <div onClick={() => { setDropdownOpen(false); navigate('/profile'); }}>个人中心</div>
                  <div onClick={handleLogout}>退出登录</div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
}
