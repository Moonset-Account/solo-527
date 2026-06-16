import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from '@remix-run/react';

const menuItems = [
  { key: '/', icon: '📊', label: '数据概览' },
  { key: '/pets', icon: '🐕', label: '宠物档案' },
  { key: '/adoptions', icon: '📋', label: '领养审核' },
  { key: '/training', icon: '🎓', label: '训练记录' },
  { key: '/visits', icon: '🏠', label: '回访管理' },
  { key: '/flow-records', icon: '📜', label: '流转记录' },
  { key: '/stats', icon: '📈', label: '统计分析' },
  { key: '/safety', icon: '⚠️', label: '安全提醒' },
];

export default function AppLayout() {
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {sidebarOpen && (
        <div
          onClick={closeSidebar}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 40,
            display: 'block',
          }}
        />
      )}

      <aside
        style={{
          width: 240,
          backgroundColor: '#1f2937',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 50,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s',
        }}
        className="sidebar-desktop"
      >
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #374151',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <span style={{ fontSize: '1.75rem' }}>🐾</span>
          <span style={{ fontWeight: 600, fontSize: '1.125rem' }}>宠物寄养台</span>
        </div>

        <nav style={{ flex: 1, padding: '0.5rem', overflowY: 'auto' }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.key || 
              (item.key !== '/' && location.pathname.startsWith(item.key));
            return (
              <Link
                key={item.key}
                to={item.key}
                onClick={closeSidebar}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '0.25rem',
                  color: isActive ? '#fff' : '#9ca3af',
                  backgroundColor: isActive ? '#4f46e5' : 'transparent',
                  transition: 'all 0.2s',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#374151';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                  }
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                <span style={{ fontWeight: 500 }}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{
          padding: '1rem',
          borderTop: '1px solid #374151',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '0.75rem',
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
            }}>
              {user.name?.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 500 }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                {user.role === 'admin' ? '管理员' : user.role === 'trainer' ? '训练师' : '审核员'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              backgroundColor: 'transparent',
              color: '#9ca3af',
              border: '1px solid #374151',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            退出登录
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, marginLeft: 0 }} className="main-content">
        <header style={{
          height: 60,
          backgroundColor: '#fff',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          padding: '0 1.25rem',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>
          <button
            onClick={toggleSidebar}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              marginRight: '0.75rem',
              display: 'flex',
            }}
            className="menu-toggle"
          >
            <span style={{ fontSize: '1.5rem' }}>☰</span>
          </button>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
            {menuItems.find(m => location.pathname === m.key || (m.key !== '/' && location.pathname.startsWith(m.key)))?.label || '数据概览'}
          </h2>
        </header>

        <main style={{
          padding: '1.5rem',
          backgroundColor: '#f3f4f6',
          minHeight: 'calc(100vh - 60px)',
        }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .sidebar-desktop {
            transform: translateX(0) !important;
          }
          .main-content {
            margin-left: 240px !important;
          }
          .menu-toggle {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
