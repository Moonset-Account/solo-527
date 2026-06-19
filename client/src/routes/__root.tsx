import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold text-primary-600">
              🔧 家电维修售后中心
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-gray-600 hover:text-primary-600 transition-colors">
                首页
              </Link>
              <Link to="/book" className="text-gray-600 hover:text-primary-600 transition-colors">
                在线预约
              </Link>
              <Link to="/admin" className="text-gray-600 hover:text-primary-600 transition-colors">
                管理后台
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  ),
});
