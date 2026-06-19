import { createFileRoute, Outlet, Link, useLocation } from '@tanstack/react-router';

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
});

const menuItems = [
  { path: '/admin', label: '数据概览', icon: '📊' },
  { path: '/admin/orders', label: '订单管理', icon: '📦' },
  { path: '/admin/refunds', label: '退款管理', icon: '💰' },
  { path: '/admin/reviews', label: '差评跟进', icon: '⭐' },
  { path: '/admin/technicians', label: '师傅负载', icon: '🔧' },
  { path: '/admin/reschedule', label: '改约取消', icon: '📅' },
  { path: '/admin/analytics', label: '履约分析', icon: '📈' },
];

function AdminLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r shadow-sm flex-shrink-0">
        <div className="p-4 border-b">
          <h1 className="text-lg font-bold text-gray-800">🔧 维修站长后台</h1>
        </div>
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
