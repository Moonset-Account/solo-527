import { NavLink } from '@remix-run/react';
import { useAuth } from '~/utils/auth';

const menuItems = [
  { path: '/dashboard', label: '仪表盘', icon: '📊' },
  { path: '/orders', label: '订单管理', icon: '📋' },
  { path: '/services', label: '服务项管理', icon: '🔧' },
  { path: '/pricing-rules', label: '加价规则', icon: '💰' },
  { path: '/technicians', label: '师傅管理', icon: '👷' },
  { path: '/parts', label: '配件管理', icon: '⚙️' },
  { path: '/satisfaction', label: '售后满意', icon: '⭐' },
  { path: '/refunds', label: '退款管理', icon: '💸' },
  { path: '/reports/price-transparency', label: '价格透明报表', icon: '📈' },
  { path: '/reports/sales', label: '销售报表', icon: '📊' },
  { path: '/audit-logs', label: '审计日志', icon: '📝' }
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  
  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col h-screen fixed left-0 top-0">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">家电维修管理系统</h1>
        <p className="text-xs text-gray-400 mt-1">价格配置后台</p>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <span className="mr-3 text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{user?.name || '用户'}</p>
            <p className="text-xs text-gray-400">
              {user?.role === 'super_admin' ? '超级管理员' :
               user?.role === 'store_manager' ? '店长' :
               user?.role === 'customer_service' ? '客服' : user?.role}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full py-2 px-4 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
        >
          退出登录
        </button>
      </div>
    </div>
  );
}
