import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  Building2,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { path: '/dashboard', label: '后台看板', icon: LayoutDashboard, roles: ['admin', 'manager', 'product', 'sales', 'finance'] },
  { path: '/demands', label: '客户需求', icon: FileText, roles: ['admin', 'manager', 'product', 'sales'] },
  { path: '/quotes', label: '报价管理', icon: Receipt, roles: ['admin', 'manager', 'product', 'sales'] },
  { path: '/contracts', label: '合同审批', icon: FileText, roles: ['admin', 'manager', 'sales', 'finance'] },
  { path: '/suppliers', label: '供应商', icon: Building2, roles: ['admin', 'manager', 'product'] },
  { path: '/finance/profit', label: '利润统计', icon: TrendingUp, roles: ['admin', 'manager', 'finance'] },
  { path: '/settings/users', label: '系统设置', icon: Settings, roles: ['admin'] },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredMenuItems = menuItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <span className="font-bold text-lg">旅行报价</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>首页</span>
            <ChevronDown size={14} />
            <span className="text-slate-700 font-medium">
              {menuItems.find((item) => location.pathname.startsWith(item.path))?.label || '工作台'}
            </span>
          </div>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-medium">
                {user?.name?.charAt(0)}
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-slate-700">{user?.name}</div>
                <div className="text-xs text-slate-500">
                  {user?.role === 'admin'
                    ? '管理员'
                    : user?.role === 'manager'
                    ? '主管'
                    : user?.role === 'product'
                    ? '产品经理'
                    : user?.role === 'sales'
                    ? '销售'
                    : '财务'}
                </div>
              </div>
              <ChevronDown size={16} className="text-slate-400" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};
