import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

const Layout = () => {
  const { user, logout, isProjectManager, isTeacher } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: '事件看板', icon: '📋', roles: ['project_manager', 'teacher'] },
    { path: '/map', label: '点位地图', icon: '🗺️', roles: ['project_manager'] },
    { path: '/reports', label: '数据报表', icon: '📊', roles: ['project_manager'] },
    { path: '/event/new', label: '补录事件', icon: '➕', roles: ['teacher'] },
    { path: '/public', label: '公开报表', icon: '📈', roles: ['project_manager', 'teacher'] },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-primary-700 text-white flex flex-col">
        <div className="p-6 border-b border-primary-600">
          <h1 className="text-xl font-bold">研学营地</h1>
          <p className="text-primary-200 text-sm">安全事件复盘看板</p>
        </div>
        
        <nav className="flex-1 py-4">
          {navItems.filter(item => 
            item.roles.includes(user?.role || '') || (user?.role === 'project_manager')
          ).map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 transition-colors ${
                  isActive
                    ? 'bg-primary-600 border-r-4 border-warning'
                    : 'hover:bg-primary-600'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-primary-600">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <div className="font-medium">{user?.name}</div>
              <div className="text-xs text-primary-200">
                {user?.role === 'project_manager' ? '项目负责人' : '带队老师'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 text-sm bg-primary-600 hover:bg-primary-500 rounded-lg transition-colors"
          >
            退出登录
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
