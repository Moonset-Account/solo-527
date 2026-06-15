import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-lg font-semibold text-gray-800">
              🐾 寄养训练台
            </Link>
            <div className="flex gap-4 text-sm">
              <Link to="/pets/new" className="text-gray-600 hover:text-blue-600">
                宠物登记
              </Link>
              <Link to="/pets" className="text-gray-600 hover:text-blue-600">
                宠物列表
              </Link>
              <Link to="/records" className="text-gray-600 hover:text-blue-600">
                寄养记录
              </Link>
              <Link to="/schedules" className="text-gray-600 hover:text-blue-600">
                排班负荷
              </Link>
              <Link to="/receipts" className="text-gray-600 hover:text-blue-600">
                单据管理
              </Link>
              <Link to="/callbacks" className="text-gray-600 hover:text-blue-600">
                异常回调
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </div>
  ),
});
