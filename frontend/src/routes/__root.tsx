import { createRootRoute, Outlet, Link, useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/utils/api';
import { ShoppingBag, User, Home } from 'lucide-react';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const location = useLocation();
  const { isAuthenticated, setAuth, user, role, logout } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchCurrentUser();
    }
  }, [isAuthenticated, user]);

  const fetchCurrentUser = async () => {
    try {
      const data = await api.get('/auth/me');
      if (data.user) {
        setAuth(useAuthStore.getState().token!, data.user, data.role);
      }
    } catch {
      logout();
    }
  };

  const isAdminPage = location.pathname.startsWith('/admin');

  if (isAdminPage) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-cream-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-brand-700">会员积分商城</span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              to="/"
              className="px-4 py-2 rounded-lg text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-colors flex items-center gap-1.5 text-sm font-medium"
            >
              <Home className="w-4 h-4" />
              首页
            </Link>
            <Link
              to="/products"
              className="px-4 py-2 rounded-lg text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-colors flex items-center gap-1.5 text-sm font-medium"
            >
              <ShoppingBag className="w-4 h-4" />
              全部商品
            </Link>
            {isAuthenticated && role === 'member' ? (
              <div className="flex items-center gap-2 ml-2">
                <Link
                  to="/my/orders"
                  className="px-4 py-2 rounded-lg text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-colors text-sm font-medium"
                >
                  兑换记录
                </Link>
                <Link
                  to="/my/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 hover:bg-brand-100 transition-colors"
                >
                  <User className="w-4 h-4 text-brand-600" />
                  <span className="text-sm font-medium text-brand-700">
                    {(user as any)?.nickname || '会员'}
                  </span>
                </Link>
              </div>
            ) : (
              <Link
                to="/login"
                className="ml-2 px-5 py-2 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors shadow-sm hover:shadow-md"
              >
                登录
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-cream-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2024 会员触达台 - 母婴会员积分商城</p>
          <p className="mt-1 text-gray-400">专注母婴行业会员积分运营解决方案</p>
        </div>
      </footer>
    </div>
  );
}
