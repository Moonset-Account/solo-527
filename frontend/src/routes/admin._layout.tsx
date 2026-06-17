import { createFileRoute, Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/authStore';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Megaphone,
  BarChart3,
  Settings,
  FileText,
  Shield,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/admin/_layout')({
  component: AdminLayoutComponent,
});

function AdminLayoutComponent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: '仪表盘', roles: ['admin', 'ecommerce'] },
    { path: '/admin/products', icon: Package, label: '商品管理', roles: ['admin', 'ecommerce'] },
    { path: '/admin/orders', icon: ShoppingCart, label: '订单核销', roles: ['admin', 'ecommerce'] },
    { path: '/admin/members', icon: Users, label: '会员管理', roles: ['admin', 'ecommerce'] },
    { path: '/admin/levels', icon: Shield, label: '等级配置', roles: ['admin'] },
    { path: '/admin/reach', icon: Megaphone, label: '触达任务', roles: ['admin', 'ecommerce'] },
    { path: '/admin/statistics', icon: BarChart3, label: '积分成本', roles: ['admin', 'ecommerce'] },
    { path: '/admin/users', icon: Users, label: '用户管理', roles: ['admin'] },
    { path: '/admin/logs', icon: FileText, label: '操作日志', roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    role ? item.roles.includes(role) : false
  );

  const handleLogout = () => {
    logout();
    navigate({ to: '/admin/login' });
  };

  const adminUser = user as any;

  return (
    <div className="flex h-screen bg-slate-50">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-sm">会员触达台</h1>
                <p className="text-xs text-slate-400">管理后台</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-500/20 text-brand-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <div className={`flex items-center gap-3 ${sidebarOpen ? 'px-2' : 'justify-center'}`}>
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{adminUser?.username || '管理员'}</p>
                <p className="text-xs text-slate-500">
                  {role === 'admin' ? '管理员' : '电商负责人'}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`w-full mt-3 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors ${
              sidebarOpen ? '' : 'justify-center'
            }`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span>退出登录</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
