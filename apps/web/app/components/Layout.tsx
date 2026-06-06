import { Link, useNavigate, useLocation } from '@remix-run/react';
import { useAuth } from '~/contexts/AuthContext';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-primary-600">社区物资借还平台</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <Link
            to="/"
            className={`block px-4 py-2 rounded-lg ${isActive('/') && !isActive('/activities') && !isActive('/materials') && !isActive('/borrows') && !isActive('/compensations') && !isActive('/audit') ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            仪表盘
          </Link>
          
          <Link
            to="/activities"
            className={`block px-4 py-2 rounded-lg ${isActive('/activities') ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            活动日历
          </Link>
          
          <Link
            to="/materials"
            className={`block px-4 py-2 rounded-lg ${isActive('/materials') ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            物资管理
          </Link>
          
          <Link
            to="/borrows"
            className={`block px-4 py-2 rounded-lg ${isActive('/borrows') ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            借用管理
          </Link>
          
          {(user?.role === 'warehouse_manager' || user?.role === 'admin') && (
            <>
              <Link
                to="/scan"
                className={`block px-4 py-2 rounded-lg ${isActive('/scan') ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                扫码借还
              </Link>
              
              <Link
                to="/compensations"
                className={`block px-4 py-2 rounded-lg ${isActive('/compensations') ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                赔付管理
              </Link>
              
              <Link
                to="/audit"
                className={`block px-4 py-2 rounded-lg ${isActive('/audit') ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                审计日志
              </Link>
            </>
          )}
        </nav>
        
        <div className="p-4 border-t">
          <div className="mb-3">
            <p className="font-medium text-gray-800">{user?.realName}</p>
            <p className="text-sm text-gray-500">
              {user?.role === 'admin' ? '管理员' : user?.role === 'warehouse_manager' ? '仓管' : '活动负责人'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
          >
            退出登录
          </button>
        </div>
      </aside>
      
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
